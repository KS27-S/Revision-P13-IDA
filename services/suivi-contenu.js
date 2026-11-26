/*
 * services/suivi-contenu.js
 * Fournit à l'administration le suivi des contenus, module par module.
 *
 * Le point important est la notion de "complet et valide" : le bouton
 * "Tout publier" ne doit jamais publier un gabarit vide ni le fichier TD
 * signalé comme incomplet dans RAPPORT_CONTENU.md. On réutilise donc les
 * mêmes fonctions de validation que l'import.
 */

const {
  validerQuiz,
  validerTD,
} = require("./validation-contenu");

function estComplet(base, moduleId, type) {
  if (type === "rappel") {
    const rappel = base
      .prepare("SELECT contenu_html FROM rappels WHERE module_id = ?")
      .get(moduleId);
    return Boolean(rappel && rappel.contenu_html.trim().length > 0);
  }

  if (type === "quiz") {
    const quiz = base.prepare("SELECT id FROM quiz WHERE module_id = ?").get(moduleId);
    if (!quiz) {
      return false;
    }
    const questions = base
      .prepare("SELECT * FROM questions_quiz WHERE quiz_id = ? ORDER BY ordre_original")
      .all(quiz.id)
      .map(function (question) {
        return {
          id: question.question_ref,
          niveau: question.niveau,
          enonce: question.enonce,
          choix: JSON.parse(question.choix_json),
          reponse: question.reponse_index,
          explication: question.explication,
        };
      });
    return validerQuiz({ questions }).complet;
  }

  if (type === "td") {
    const td = base.prepare("SELECT id FROM td WHERE module_id = ?").get(moduleId);
    if (!td) {
      return false;
    }
    const exercices = base
      .prepare("SELECT * FROM exercices_td WHERE td_id = ? ORDER BY ordre_original")
      .all(td.id)
      .map((exercice) => JSON.parse(exercice.donnees_json));
    return validerTD({ exercices }).complet;
  }

  return false;
}

function listerContenus(base) {
  const modules = base
    .prepare(
      `SELECT m.id AS module_id, m.slug AS module_slug, m.titre AS module_titre,
              mat.slug AS matiere_slug, mat.nom AS matiere_nom,
              m.ordre_affichage,
              c.statut, c.verrouille,
              (SELECT COUNT(*) FROM questions_quiz qq
                 JOIN quiz q ON q.id = qq.quiz_id WHERE q.module_id = m.id) AS nb_questions,
              (SELECT COUNT(*) FROM exercices_td e
                 JOIN td t ON t.id = e.td_id WHERE t.module_id = m.id) AS nb_exercices,
              (SELECT COUNT(*) FROM rappels r WHERE r.module_id = m.id) AS nb_rappels
       FROM modules m
       JOIN matieres mat ON mat.id = m.matiere_id
       LEFT JOIN contenus c ON c.module_id = m.id AND c.type = 'rappel'
       ORDER BY mat.ordre_affichage, m.ordre_affichage`
    )
    .all();

  const contenus = [];
  modules.forEach(function (module) {
    ["rappel", "quiz", "td"].forEach(function (type) {
      let detail = "";
      if (type === "rappel") {
        detail = module.nb_rappels > 0 ? "Fiche enregistrée" : "Aucun texte source";
      } else if (type === "quiz") {
        detail = `${module.nb_questions} question(s) / 20 attendues`;
      } else {
        detail = `${module.nb_exercices} exercice(s)`;
      }

      contenus.push({
        moduleId: module.module_id,
        matiereSlug: module.matiere_slug,
        matiereNom: module.matiere_nom,
        moduleSlug: module.module_slug,
        moduleTitre: module.module_titre,
        type,
        // Les statuts des trois types sont lus séparément : la requête ci-dessus
        // ne joint que 'rappel' pour éviter trois lignes par module.
        statut: base
          .prepare("SELECT statut FROM contenus WHERE module_id = ? AND type = ?")
          .get(module.module_id, type)?.statut || "vide",
        verrouille: Boolean(
          base
            .prepare("SELECT verrouille FROM contenus WHERE module_id = ? AND type = ?")
            .get(module.module_id, type)?.verrouille
        ),
        complet: estComplet(base, module.module_id, type),
        detail,
      });
    });
  });
  return contenus;
}

function publierContenu(base, type, moduleId) {
  const ligne = base
    .prepare("SELECT verrouille FROM contenus WHERE module_id = ? AND type = ?")
    .get(moduleId, type);
  if (!ligne) {
    return { erreur: "Suivi de contenu introuvable." };
  }
  if (ligne.verrouille) {
    return { erreur: "Ce contenu est verrouillé par l'administrateur." };
  }
  if (!estComplet(base, moduleId, type)) {
    return { erreur: "Contenu vide ou incomplet : publication refusée." };
  }
  base
    .prepare("UPDATE contenus SET statut = 'publie' WHERE module_id = ? AND type = ?")
    .run(moduleId, type);
  return { ok: true };
}

function depublierContenu(base, type, moduleId) {
  const resultat = base
    .prepare("UPDATE contenus SET statut = 'brouillon' WHERE module_id = ? AND type = ?")
    .run(moduleId, type);
  if (resultat.changes === 0) {
    return { erreur: "Suivi de contenu introuvable." };
  }
  return { ok: true };
}

function verrouillerContenu(base, type, moduleId, verrouille) {
  const resultat = base
    .prepare("UPDATE contenus SET verrouille = ? WHERE module_id = ? AND type = ?")
    .run(verrouille ? 1 : 0, moduleId, type);
  if (resultat.changes === 0) {
    return { erreur: "Suivi de contenu introuvable." };
  }
  return { ok: true };
}

// "Tout publier" ne touche que les contenus complets et non verrouillés.
function toutPublier(base) {
  const publier = base.transaction(function () {
    let publies = 0;
    let ignores = 0;
    listerContenus(base).forEach(function (contenu) {
      if (contenu.complet && !contenu.verrouille) {
        base
          .prepare("UPDATE contenus SET statut = 'publie' WHERE module_id = ? AND type = ?")
          .run(contenu.moduleId, contenu.type);
        publies += 1;
      } else {
        ignores += 1;
      }
    });
    return { publies, ignores };
  });
  return publier();
}

module.exports = {
  estComplet,
  listerContenus,
  publierContenu,
  depublierContenu,
  verrouillerContenu,
  toutPublier,
};
