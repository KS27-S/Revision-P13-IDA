/*
 * routes/quiz.js
 * API du quiz. Tout se joue côté serveur : le navigateur ne reçoit jamais les
 * bonnes réponses ni les explications avant la correction.
 *
 * Ordre des contrôles, impératif :
 *  1. connexion + compte validé (middleware) ;
 *  2. peutAcceder(user, module, "quiz") : offre, abonnement, module offert ;
 *  3. progression : le quiz du module précédent doit être validé ;
 *  4. publication : le quiz doit avoir le statut 'publie' choisi par l'admin.
 */

const express = require("express");
const base = require("../db/connexion");
const {
  exigerConnexion,
  exigerStatutValide,
} = require("../middleware/authentification");
const { peutAcceder, offresQuiDonnentAcces } = require("../services/acces");
const {
  obtenirModuleParSlugs,
  verifierProgression,
} = require("../services/progression");
const {
  demarrerTentative,
  corrigerTentative,
} = require("../services/tentatives");

const router = express.Router();
router.use(exigerConnexion, exigerStatutValide);

function refuser(res, statut, message, extra) {
  return res.status(statut).json({ erreur: message, ...(extra || {}) });
}

function chargerModule(req, res) {
  const module = obtenirModuleParSlugs(
    base,
    req.params.matiereSlug,
    req.params.moduleSlug
  );
  if (!module) {
    refuser(res, 404, "Module introuvable.");
    return null;
  }

  // L'accès par offre passe TOUJOURS en premier, avant la progression.
  const acces = peutAcceder(req.utilisateur, module, "quiz");
  if (!acces.autorise) {
    refuser(res, 403, acces.raison, { offres: acces.offres });
    return null;
  }

  const progression = verifierProgression(base, req.utilisateur, module);
  if (!progression.autorise) {
    refuser(res, 403, progression.raison, {
      modulePrecedent: progression.modulePrecedent,
    });
    return null;
  }

  return module;
}

function quizPublie(moduleId) {
  const ligne = base
    .prepare("SELECT statut FROM contenus WHERE module_id = ? AND type = 'quiz'")
    .get(moduleId);
  const quiz = base.prepare("SELECT id, titre FROM quiz WHERE module_id = ?").get(moduleId);
  return {
    publie: Boolean(ligne && ligne.statut === "publie" && quiz),
    statut: ligne ? ligne.statut : "vide",
    titre: quiz ? quiz.titre : "",
  };
}

// Démarrer (ou reprendre) un quiz. La réponse contient 20 questions sans
// réponse ni explication, ainsi que l'identifiant de la tentative serveur.
router.get("/:matiereSlug/:moduleSlug", (req, res) => {
  const module = chargerModule(req, res);
  if (!module) {
    return;
  }

  const etatQuiz = quizPublie(module.id);
  if (!etatQuiz.publie) {
    return refuser(res, 403, "Ce quiz n'est pas encore publié.", {
      statutContenu: etatQuiz.statut,
    });
  }

  try {
    const quiz = base.prepare("SELECT id FROM quiz WHERE module_id = ?").get(module.id);
    const demarrage = demarrerTentative(
      base,
      req.utilisateur.id,
      module.id,
      quiz.id
    );

    if (demarrage.refuse) {
      return refuser(res, 429, "Reprise possible après 12 heures d'attente.", {
        attenteMs: demarrage.attenteMs,
        tentativesRestantes: 0,
      });
    }

    return res.json({
      matiere: module.matiere_slug,
      matiereNom: module.matiere_nom,
      module: module.slug,
      moduleTitre: module.titre,
      titre: etatQuiz.titre,
      tentative: demarrage.tentative,
      questions: demarrage.questions,
      seuilReussite: 14,
      seuilValidation: 10,
    });
  } catch (erreur) {
    console.error("Démarrage quiz impossible :", erreur.message);
    return refuser(res, 500, "Erreur interne du serveur.");
  }
});

// Soumettre les réponses. Le client envoie uniquement des positions de choix.
router.post("/:tentativeId/reponses", (req, res) => {
  const tentativeId = Number(req.params.tentativeId);
  if (!Number.isInteger(tentativeId) || tentativeId < 1) {
    return refuser(res, 400, "Identifiant de tentative invalide.");
  }

  const ligne = base
    .prepare("SELECT module_id FROM tentatives_quiz WHERE id = ? AND utilisateur_id = ?")
    .get(tentativeId, req.utilisateur.id);
  if (!ligne) {
    return refuser(res, 404, "Tentative introuvable.");
  }

  const module = base
    .prepare(
      `SELECT m.*, mat.slug AS matiere_slug
       FROM modules m JOIN matieres mat ON mat.id = m.matiere_id
       WHERE m.id = ?`
    )
    .get(ligne.module_id);

  const acces = peutAcceder(req.utilisateur, module, "quiz");
  if (!acces.autorise) {
    return refuser(res, 403, acces.raison, { offres: acces.offres });
  }
  const progression = verifierProgression(base, req.utilisateur, module);
  if (!progression.autorise) {
    return refuser(res, 403, progression.raison);
  }

  try {
    const resultat = corrigerTentative(
      base,
      req.utilisateur.id,
      tentativeId,
      req.body && req.body.reponses
    );
    if (resultat.erreur) {
      return refuser(res, 400, resultat.erreur);
    }
    return res.json(resultat);
  } catch (erreur) {
    console.error("Correction quiz impossible :", erreur.message);
    return refuser(res, 500, "Erreur interne du serveur.");
  }
});

module.exports = router;
