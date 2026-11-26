/*
 * scripts/importer-contenu.js
 * Lit les fichiers .json de contenu déjà produits, les valide et les range en
 * base. C'est le pendant de "npm run importer-rappels" pour les quiz et les TD.
 *
 * Pourquoi un script et pas un chargement direct des JSON par le serveur :
 * les fichiers contiennent les bonnes réponses et les corrigés. S'il étaient
 * servis tels quels, n'importe qui pourrait les lire avec l'URL du fichier.
 * Une fois en base, le serveur peut décider qui voit quoi.
 *
 * Le script peut être relancé : INSERT OR IGNORE garde les statuts choisis par
 * l'admin, et on ne réécrit une table que si le contenu du fichier a changé.
 * Un contenu verrouillé par l'admin n'est jamais écrasé.
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { validerQuiz, validerTD } = require("../services/validation-contenu");

const DOSSIER_CONTENU_PAR_DEFAUT = path.resolve(
  __dirname,
  "..",
  "public",
  "quiz-contenu",
  "content"
);
const FICHIER_GABARITS_RAPPELS = path.resolve(
  __dirname,
  "..",
  "donnees",
  "rappels-a-rediger.md"
);

// Cherche le dossier réel d'une matière. On ne fait pas confiance à la clé
// "dossier" de _index.json : elle vaut "algorithmique" alors que le dossier
// s'appelle "algorithme" dans les fichiers livrés.
function resoudreDossierMatiere(racine, entree, dossiers) {
  const candidats = [];
  if (entree.dossier) {
    candidats.push(entree.dossier);
  }
  candidats.push(...dossiers);

  for (const candidat of candidats) {
    const chemin = path.join(racine, candidat, "_matiere.json");
    if (!fs.existsSync(chemin)) {
      continue;
    }
    try {
      const matiere = JSON.parse(fs.readFileSync(chemin, "utf8"));
      if (matiere.id === entree.id) {
        return candidat;
      }
    } catch (erreur) {
      // Un fichier cassé n'est pas une Correspondance : on essaie le suivant.
    }
  }
  throw new Error(`Dossier introuvable pour la matière '${entree.id}'.`);
}

// Lit _index.json puis tous les _matiere.json. Les noms de fichiers des modules
// sont gardés tels quels : on n'invente aucun nouveau format.
function listerFichiersContenu(racine) {
  const cheminIndex = path.join(racine, "_index.json");
  if (!fs.existsSync(cheminIndex)) {
    throw new Error(`Index introuvable : ${cheminIndex}`);
  }
  const index = JSON.parse(fs.readFileSync(cheminIndex, "utf8"));
  const dossiers = fs
    .readdirSync(racine, { withFileTypes: true })
    .filter((entree) => entree.isDirectory())
    .map((entree) => entree.name);

  return (index.matieres || []).map(function (entree) {
    const dossier = resoudreDossierMatiere(racine, entree, dossiers);
    const matiere = JSON.parse(
      fs.readFileSync(path.join(racine, dossier, "_matiere.json"), "utf8")
    );
    return {
      id: entree.id,
      titre: entree.titre,
      dossier,
      modules: matiere.modules || [],
    };
  });
}

function lireJson(chemin) {
  if (!fs.existsSync(chemin)) {
    throw new Error(`Fichier introuvable : ${chemin}`);
  }
  return JSON.parse(fs.readFileSync(chemin, "utf8"));
}

function empreinteFichier(chemin) {
  const brut = fs.readFileSync(chemin, "utf8");
  return crypto.createHash("sha256").update(brut).digest("hex");
}

// Sécurité : un nom de fichier venant d'un JSON ne doit jamais pouvoir sortir
// du dossier de la matière (par exemple avec "../").
function cheminDansDossier(racine, dossier, nomFichier) {
  const baseDossier = path.resolve(racine, dossier);
  const chemin = path.resolve(baseDossier, nomFichier);
  if (!chemin.startsWith(baseDossier + path.sep)) {
    throw new Error(`Nom de fichier invalide : ${nomFichier}`);
  }
  return chemin;
}

function insererStatut(base, moduleId, type, statut) {
  base
    .prepare(
      `INSERT OR IGNORE INTO contenus (module_id, type, statut)
       VALUES (?, ?, ?)`
    )
    .run(moduleId, type, statut);
}

function estVerrouille(base, moduleId, type) {
  const ligne = base
    .prepare("SELECT verrouille FROM contenus WHERE module_id = ? AND type = ?")
    .get(moduleId, type);
  return Boolean(ligne && ligne.verrouille);
}

function marquerBrouillon(base, moduleId, type) {
  // On ne change que les contenus encore 'vide' : un statut choisi par l'admin
  // (brouillon ou publié) survit à un nouvel import.
  base
    .prepare(
      `UPDATE contenus SET statut = 'brouillon'
       WHERE module_id = ? AND type = ? AND statut = 'vide'`
    )
    .run(moduleId, type);
}

function enregistrerHash(base, moduleId, type, hash) {
  base
    .prepare(
      `UPDATE contenus SET source_hash = ?, date_maj = datetime('now')
       WHERE module_id = ? AND type = ?`
    )
    .run(hash, moduleId, type);
}

// Enregistre ou met à jour les 20 questions. La suppression puis la réinsertion
// restent dans la transaction globale : on ne perd jamais la version précédente
// si une erreur survient au milieu.
function enregistrerQuiz(base, moduleId, donnees, hash) {
  const existant = base
    .prepare("SELECT id, source_hash FROM quiz WHERE module_id = ?")
    .get(moduleId);

  if (existant && existant.source_hash === hash) {
    return "inchanges";
  }

  let quizId;
  if (existant) {
    quizId = existant.id;
    base
      .prepare(
        `UPDATE quiz SET titre = ?, sources_json = ?, source_hash = ?,
                date_modification = datetime('now')
         WHERE id = ?`
      )
      .run(donnees.titre || "", JSON.stringify(donnees.sources || []), hash, quizId);
    base.prepare("DELETE FROM questions_quiz WHERE quiz_id = ?").run(quizId);
  } else {
    const resultat = base
      .prepare(
        `INSERT INTO quiz (module_id, titre, sources_json, source_hash)
         VALUES (?, ?, ?, ?)`
      )
      .run(
        moduleId,
        donnees.titre || "",
        JSON.stringify(donnees.sources || []),
        hash
      );
    quizId = resultat.lastInsertRowid;
  }

  const insererQuestion = base.prepare(
    `INSERT INTO questions_quiz
       (quiz_id, question_ref, niveau, enonce, choix_json, reponse_index,
        explication, code_source, ordre_original)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  donnees.questions.forEach(function (question, index) {
    insererQuestion.run(
      quizId,
      question.id,
      question.niveau,
      question.enonce,
      JSON.stringify(question.choix),
      question.reponse,
      question.explication,
      question.code || null,
      index
    );
  });
  return existant ? "mis_a_jour" : "importes";
}

function enregistrerTD(base, moduleId, donnees, hash) {
  const existant = base
    .prepare("SELECT id, source_hash FROM td WHERE module_id = ?")
    .get(moduleId);

  if (existant && existant.source_hash === hash) {
    return "inchanges";
  }

  let tdId;
  if (existant) {
    tdId = existant.id;
    base
      .prepare(
        `UPDATE td SET titre = ?, source_hash = ?,
                 date_modification = datetime('now')
         WHERE id = ?`
      )
      .run(donnees.titre || "", hash, tdId);
    base.prepare("DELETE FROM exercices_td WHERE td_id = ?").run(tdId);
  } else {
    const resultat = base
      .prepare(
        "INSERT INTO td (module_id, titre, source_hash) VALUES (?, ?, ?)"
      )
      .run(moduleId, donnees.titre || "", hash);
    tdId = resultat.lastInsertRowid;
  }

  const insererExercice = base.prepare(
    `INSERT INTO exercices_td
       (td_id, exercice_ref, type, donnees_json, ordre_original)
     VALUES (?, ?, ?, ?, ?)`
  );
  donnees.exercices.forEach(function (exercice, index) {
    insererExercice.run(
      tdId,
      exercice.id,
      exercice.type || "exercice",
      JSON.stringify(exercice),
      index
    );
  });
  return existant ? "mis_a_jour" : "importes";
}

/*
 * Fonction principale. "base" est reçue en paramètre pour que les tests
 * puissent utiliser une base temporaire sans toucher à la vraie base du site.
 */
function importerContenu(base, racineContenu) {
  const racine = racineContenu || DOSSIER_CONTENU_PAR_DEFAUT;
  const matieres = listerFichiersContenu(racine);
  const modulesBase = base
    .prepare(
      `SELECT m.id, m.slug, m.titre, mat.slug AS matiere_slug
       FROM modules m JOIN matieres mat ON mat.id = m.matiere_id`
    )
    .all();
  const modulesParCle = new Map(
    modulesBase.map((module) => [`${module.matiere_slug}|${module.slug}`, module])
  );

  const rapport = {
    matieres: matieres.length,
    modules: modulesBase.length,
    quiz: { importes: 0, mis_a_jour: 0, inchanges: 0, verrouilles: 0, invalides: 0, vides: 0 },
    td: { importes: 0, mis_a_jour: 0, inchanges: 0, verrouilles: 0, invalides: 0, vides: 0 },
    rappels: { dejaEnBase: 0, gabaritsVides: 0, gabaritsAttendus: 0 },
    erreurs: [],
  };

  const gabaritRappels = fs.existsSync(FICHIER_GABARITS_RAPPELS)
    ? fs.readFileSync(FICHIER_GABARITS_RAPPELS, "utf8")
    : "";
  rapport.rappels.gabaritsAttendus = (
    gabaritRappels.match(/^# Rappel de cours :/gm) || []
  ).length;

  const importer = base.transaction(function () {
    // Étape 1 : une ligne de statut par module et par type. Les rappels déjà
    // en base restent 'publie' (comportement actuel du site) ; leur texte et
    // leur titre ne sont jamais touchés.
    modulesBase.forEach(function (module) {
      const rappelExistant = base
        .prepare("SELECT 1 FROM rappels WHERE module_id = ?")
        .get(module.id);
      if (rappelExistant) {
        rapport.rappels.dejaEnBase += 1;
      } else {
        rapport.rappels.gabaritsVides += 1;
      }
      insererStatut(base, module.id, "rappel", rappelExistant ? "publie" : "vide");
      insererStatut(base, module.id, "quiz", "vide");
      insererStatut(base, module.id, "td", "vide");
    });

    // Étape 2 : les quiz et les TD, module par module, dans l'ordre des
    // _matiere.json. On garde les erreurs pour les afficher en fin de script.
    matieres.forEach(function (matiere) {
      matiere.modules.forEach(function (module) {
        const ligne = modulesParCle.get(`${matiere.id}|${module.id}`);
        if (!ligne) {
          rapport.erreurs.push({
            fichier: `${matiere.dossier}/${module.id}`,
            erreurs: ["Module absent de la base : lancez d'abord npm run init-contenu."],
          });
          return;
        }

        [
          {
            type: "quiz",
            nom: module.quiz,
            validation: validerQuiz,
            enregistrer: enregistrerQuiz,
          },
          {
            type: "td",
            nom: module.td || `${module.id}.td.json`,
            validation: validerTD,
            enregistrer: enregistrerTD,
          },
        ].forEach(function (tache) {
          let chemin;
          try {
            chemin = cheminDansDossier(racine, matiere.dossier, tache.nom);
          } catch (erreur) {
            rapport.erreurs.push({ fichier: tache.nom, erreurs: [erreur.message] });
            return;
          }

          if (!fs.existsSync(chemin)) {
            rapport.erreurs.push({
              fichier: path.relative(racine, chemin),
              erreurs: ["Fichier absent."],
            });
            return;
          }

          if (estVerrouille(base, ligne.id, tache.type)) {
            rapport[tache.type].verrouilles += 1;
            return;
          }

          let donnees;
          let validation;
          try {
            donnees = lireJson(chemin);
            validation = tache.validation(donnees);
          } catch (erreur) {
            rapport[tache.type].invalides += 1;
            rapport.erreurs.push({
              fichier: path.relative(racine, chemin),
              erreurs: [erreur.message],
            });
            enregistrerHash(base, ligne.id, tache.type, "");
            return;
          }

          if (validation.estVide) {
            rapport[tache.type].vides += 1;
            enregistrerHash(base, ligne.id, tache.type, empreinteFichier(chemin));
            return;
          }

          if (!validation.structureValide) {
            // On n'enregistre pas un contenu invalide, mais on le signale et on
            // laisse le statut 'brouillon' pour qu'il apparaisse dans l'admin.
            rapport[tache.type].invalides += 1;
            rapport.erreurs.push({
              fichier: path.relative(racine, chemin),
              erreurs: validation.erreurs,
            });
            marquerBrouillon(base, ligne.id, tache.type);
            enregistrerHash(base, ligne.id, tache.type, "");
            return;
          }

          const hash = empreinteFichier(chemin);
          const resultat = tache.enregistrer(base, ligne.id, donnees, hash);
          rapport[tache.type][resultat] += 1;
          enregistrerHash(base, ligne.id, tache.type, hash);
          marquerBrouillon(base, ligne.id, tache.type);
        });
      });
    });
  });

  importer();
  return rapport;
}

// Quand on lance "npm run importer-contenu", ce fichier est le programme
// principal. Quand un test le require, on ne fait que renvoyer la fonction.
if (require.main === module) {
  require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
  const base = require("../db/connexion");
  try {
    const rapport = importerContenu(base);
    console.log(
      `Import terminé : ${rapport.quiz.importes + rapport.quiz.mis_a_jour} quiz, ` +
        `${rapport.td.importes + rapport.td.mis_a_jour} TD écrits.`
    );
    console.log(
      `Rappels : ${rapport.rappels.dejaEnBase} déjà en base (inchangés), ` +
        `${rapport.rappels.gabaritsVides} gabarits vides.`
    );
    console.log(
      `Contenus vides : ${rapport.quiz.vides} quiz, ${rapport.td.vides} TD. ` +
        `Verrouillés : ${rapport.quiz.verrouilles} quiz, ${rapport.td.verrouilles} TD.`
    );
    rapport.erreurs.forEach(function (erreur) {
      // On affiche seulement les premières lignes : un fichier TD peut en
      // contenir des centaines, le rapport complet reste dans l'objet renvoyé.
      const extraits = erreur.erreurs.slice(0, 5).join(" | ");
      const suite = erreur.erreurs.length > 5 ? ` (… ${erreur.erreurs.length - 5} autre(s))` : "";
      console.warn(`Attention — ${erreur.fichier} : ${extraits}${suite}`);
    });
    if (rapport.erreurs.length > 0) {
      console.warn(
        `${rapport.erreurs.length} fichier(s) signalé(s). Le contenu n'a pas été corrigé : ` +
          `voir RAPPORT_CONTENU.md.`
      );
    }
  } catch (erreur) {
    console.error("Import impossible :", erreur.message);
    process.exitCode = 1;
  } finally {
    base.close();
  }
}

module.exports = {
  importerContenu,
  listerFichiersContenu,
  resoudreDossierMatiere,
  DOSSIER_CONTENU_PAR_DEFAUT,
};
