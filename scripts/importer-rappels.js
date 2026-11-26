/*
 * scripts/importer-rappels.js
 * Import UNIQUE des 8 rappels de cours déjà rédigés dans l'ancien rappel.html.
 *
 * Pourquoi ce script existe : le texte des rappels était écrit directement dans
 * la page HTML. N'importe qui pouvait donc le lire dans le code source, même
 * pour un module payant. On le déplace une fois pour toutes dans la table
 * "rappels" ; ensuite le serveur décide s'il peut le renvoyer ou non.
 *
 * Pourquoi le fichier source est dans donnees/ : après l'import, public/rappel.html
 * ne contient plus aucun cours. On garde une copie locale (dossier ignoré par
 * Git) pour pouvoir réimporter si la base est recréée. Le chemin peut aussi être
 * choisi avec la variable d'environnement RAPPELS_SOURCE.
 */

const fs = require("node:fs");
const path = require("node:path");

// Les espaces et les apostrophes peuvent varier d'une ligne à l'autre dans le
// HTML : on normalise uniquement pour la comparaison, jamais pour le contenu.
function normaliserTexte(texte) {
  return texte
    .replace(/\u00a0/g, " ")
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Découpe l'ancien HTML en 8 blocs. Chaque rappel est un <div class="rappel">
// qui contient un <details> avec un <summary> et le cours lui-même.
function extraireBlocs(html) {
  const blocs = [];
  const expressionBloc =
    /^ {6}<div class="rappel">\r?\n([\s\S]*?)^ {6}<\/div>/gm;
  let bloc;

  while ((bloc = expressionBloc.exec(html)) !== null) {
    const contenuBloc = bloc[1];

    const identifiant = /^ {8}<details id="rappel-([^"]+)">/m.exec(contenuBloc);
    const resume = /^ {10}<summary>([\s\S]*?)<\/summary>/m.exec(contenuBloc);
    const corps = /^ {10}<div class="rappel">\r?\n([\s\S]*?)^ {10}<\/div>/m.exec(
      contenuBloc
    );
    const matiere = /^ {8}<h4>([^<]+)<\/h4>/m.exec(contenuBloc);

    if (!identifiant || !resume || !corps) {
      continue; // Bloc sans cours : on ignore au lieu de planter.
    }

    // Le summary est de la forme "Matière — Titre du module" ; c'est la partie
    // après le tiret qui permet de retrouver le module en base.
    const resumePropre = normaliserTexte(resume[1]);
    const titreModule = resumePropre.includes(" — ")
      ? resumePropre.split(" — ").slice(1).join(" — ")
      : resumePropre;

    blocs.push({
      identifiant: identifiant[1],
      matiereHtml: matiere ? matiere[1].trim() : "",
      titreModule,
      titreComplet: resumePropre,
      // On ne modifie pas une seule balise du cours : c'est la règle de l'import.
      contenuHtml: corps[1],
    });
  }

  return blocs;
}

/*
 * Enregistre les rappels dans la base. "base" est passé en paramètre pour les
 * tests. La fonction renvoie un petit résumé (nombre importé, nombre ignoré).
 */
function importerRappels(base, cheminSource) {
  const cheminParDefaut = path.resolve(
    __dirname,
    "..",
    "donnees",
    "rappels-source.html"
  );
  const chemin = cheminSource || cheminParDefaut;
  const html = fs.readFileSync(chemin, "utf8");
  const blocs = extraireBlocs(html);

  // On associe chaque titre de module à son id en base. Les titres viennent de
  // revision.html via init-contenu : il faut donc lancer ce script avant.
  const modules = base
    .prepare(
      `SELECT m.id, m.titre, m.slug, mat.nom AS matiere
       FROM modules m JOIN matieres mat ON mat.id = m.matiere_id`
    )
    .all();
  const parTitre = new Map();
  modules.forEach(function (module) {
    const cle = normaliserTexte(module.titre);
    if (!parTitre.has(cle)) {
      parTitre.set(cle, []);
    }
    parTitre.get(cle).push(module);
  });

  const enregistrer = base.prepare(
    `INSERT INTO rappels (module_id, titre, contenu_html)
     VALUES (?, ?, ?)
     ON CONFLICT(module_id) DO UPDATE SET titre = excluded.titre,
                                          contenu_html = excluded.contenu_html`
  );
  const existeDeja = base.prepare(
    "SELECT 1 FROM rappels WHERE module_id = ?"
  );

  let importes = 0;
  let ignores = 0;
  const erreurs = [];

  const transaction = base.transaction(() => {
    blocs.forEach(function (bloc) {
      const candidats = parTitre.get(normaliserTexte(bloc.titreModule)) || [];
      if (candidats.length !== 1) {
        erreurs.push(
          `Rappel "${bloc.identifiant}" : module introuvable ou ambigu (${bloc.titreModule}).`
        );
        return;
      }
      const module = candidats[0];
      if (existeDeja.get(module.id)) {
        ignores += 1; // Le contenu est déjà en base : on ne l'écrase pas.
        return;
      }
      enregistrer.run(module.id, bloc.titreComplet, bloc.contenuHtml);
      importes += 1;
    });
  });
  transaction();

  return { importes, ignores, total: blocs.length, erreurs };
}

if (require.main === module) {
  require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
  });
  const base = require("../db/connexion");
  try {
    const resultat = importerRappels(base);
    console.log(
      `Rappels : ${resultat.importes} importés, ${resultat.ignores} déjà présents ` +
        `sur ${resultat.total} fiches trouvées.`
    );
    resultat.erreurs.forEach(function (erreur) {
      console.error(erreur);
    });
    if (resultat.total === 0 || resultat.erreurs.length > 0) {
      process.exitCode = 1;
    }
  } catch (erreur) {
    console.error("Import impossible :", erreur.message);
    process.exitCode = 1;
  } finally {
    base.close();
  }
}

module.exports = { importerRappels, extraireBlocs, normaliserTexte };
