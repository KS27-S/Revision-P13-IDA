/*
 * routes/td.js
 * API des travaux dirigés. On affiche l'énoncé et les indices, on enregistre
 * le rendu de l'étudiant, puis seulement après le dépôt on autorise la
 * correction détaillée.
 *
 * Mêmes quatre barrières que pour le quiz : compte validé, offre/abonnement,
 * déblocage par progression, publication par l'admin.
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

const router = express.Router();
router.use(exigerConnexion, exigerStatutValide);

function refuser(res, statut, message, extra) {
  return res.status(statut).json({ erreur: message, ...(extra || {}) });
}

function chargerContexte(req, res) {
  const module = obtenirModuleParSlugs(
    base,
    req.params.matiereSlug,
    req.params.moduleSlug
  );
  if (!module) {
    refuser(res, 404, "Module introuvable.");
    return null;
  }

  const acces = peutAcceder(req.utilisateur, module, "td");
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

  const statut = base
    .prepare("SELECT statut FROM contenus WHERE module_id = ? AND type = 'td'")
    .get(module.id);
  const td = base.prepare("SELECT id, titre FROM td WHERE module_id = ?").get(module.id);
  if (!statut || statut.statut !== "publie" || !td) {
    refuser(res, 403, "Ce TD n'est pas encore publié.", {
      statutContenu: statut ? statut.statut : "vide",
    });
    return null;
  }

  return { module, td };
}

function exercicesDuTD(tdId) {
  return base
    .prepare("SELECT * FROM exercices_td WHERE td_id = ? ORDER BY ordre_original")
    .all(tdId)
    .map(function (ligne) {
      return { ref: ligne.exercice_ref, ...JSON.parse(ligne.donnees_json) };
    });
}

/*
 * Version envoyée avant le rendu. On copie explicitement les champs autorisés
 * plutôt que d'envoyer tout l'objet : c'est ce qui garantit qu'aucune solution
 * ne fuite dans la réponse JSON.
 */
function exercicesSansCorrection(exercices) {
  return exercices.map(function (exercice) {
    const visible = {
      ref: exercice.ref,
      type: exercice.type,
      titre: exercice.titre || "",
      source: exercice.source || "",
      statutCorrige: exercice.statut_corrige || "",
    };
    if (Object.hasOwn(exercice, "enonce_simple")) {
      visible.enonce = exercice.enonce_simple;
      visible.indices = exercice.indices || [];
    } else {
      // Variante QCM (voir RAPPORT_CONTENU.md) : on garde l'énoncé et les choix,
      // mais jamais 'reponse' ni 'explication'.
      visible.enonce = exercice.enonce || "";
      visible.choix = exercice.choix || [];
    }
    return visible;
  });
}

function exercicesAvecCorrection(exercices) {
  return exercices.map(function (exercice) {
    return {
      ref: exercice.ref,
      titre: exercice.titre || "",
      solution: exercice.solution || "",
      explication: exercice.explication_simple || exercice.explication || "",
      attention: exercice.attention || "",
    };
  });
}

function aRendu(utilisateurId, moduleId) {
  return Boolean(
    base
      .prepare(
        "SELECT 1 FROM rendus_td WHERE utilisateur_id = ? AND module_id = ? LIMIT 1"
      )
      .get(utilisateurId, moduleId)
  );
}

function refsRendus(utilisateurId, moduleId) {
  return base
    .prepare(
      `SELECT DISTINCT exercice_ref FROM rendus_td
       WHERE utilisateur_id = ? AND module_id = ?`
    )
    .all(utilisateurId, moduleId)
    .map((ligne) => ligne.exercice_ref);
}

router.get("/:matiereSlug/:moduleSlug", (req, res) => {
  const contexte = chargerContexte(req, res);
  if (!contexte) {
    return;
  }

  try {
    const exercices = exercicesDuTD(contexte.td.id);
    return res.json({
      matiere: contexte.module.matiere_slug,
      module: contexte.module.slug,
      moduleTitre: contexte.module.titre,
      titre: contexte.td.titre,
      exercices: exercicesSansCorrection(exercices),
      aRendu: aRendu(req.utilisateur.id, contexte.module.id),
      rendus: refsRendus(req.utilisateur.id, contexte.module.id),
    });
  } catch (erreur) {
    console.error("Lecture TD impossible :", erreur.message);
    return refuser(res, 500, "Erreur interne du serveur.");
  }
});

// Dépôt du travail : texte ou code collé. Les photos et les fichiers demandent
// un espace de stockage et des formats à fixer : ce sera une autre étape.
router.post("/:matiereSlug/:moduleSlug/rendu", (req, res) => {
  const contexte = chargerContexte(req, res);
  if (!contexte) {
    return;
  }

  const exerciceRef = req.body && req.body.exerciceRef;
  const contenu = req.body && req.body.contenu;
  if (typeof exerciceRef !== "string" || typeof contenu !== "string" || !contenu.trim()) {
    return refuser(res, 400, "Choisissez un exercice et saisissez votre travail.");
  }

  const exerciceExiste = base
    .prepare(
      "SELECT 1 FROM exercices_td WHERE td_id = ? AND exercice_ref = ?"
    )
    .get(contexte.td.id, exerciceRef);
  if (!exerciceExiste) {
    return refuser(res, 400, "Exercice introuvable dans ce TD.");
  }

  try {
    const resultat = base
      .prepare(
        `INSERT INTO rendus_td (utilisateur_id, module_id, exercice_ref, contenu)
         VALUES (?, ?, ?, ?)`
      )
      .run(req.utilisateur.id, contexte.module.id, exerciceRef, contenu.trim());
    return res.status(201).json({
      id: Number(resultat.lastInsertRowid),
      aRendu: true,
      message: "Travail enregistré. La correction détaillée est maintenant accessible.",
    });
  } catch (erreur) {
    console.error("Enregistrement TD impossible :", erreur.message);
    return refuser(res, 500, "Erreur interne du serveur.");
  }
});

router.get("/:matiereSlug/:moduleSlug/correction", (req, res) => {
  const contexte = chargerContexte(req, res);
  if (!contexte) {
    return;
  }

  /*
   * -------------------------------------------------------------------------
   * EMPLACEMENT PRÉVU POUR LA VÉRIFICATION PAR L'IA (étape séparée, non faite).
   * Ici, plus tard : vérifier que le rendu est sérieux (non vide, en rapport
   * avec l'énoncé), mettre a jour rendus_td.statut_validation, puis seulement
   * autoriser la correction. Le contenu rendu sera traité comme une donnée,
   * jamais comme une instruction. Rien de tout cela n'est implémenté ici.
   * -------------------------------------------------------------------------
   */
  if (!aRendu(req.utilisateur.id, contexte.module.id)) {
    return refuser(res, 403, "Rendez votre travail avant de voir la correction.");
  }

  try {
    return res.json({
      exercices: exercicesAvecCorrection(exercicesDuTD(contexte.td.id)),
    });
  } catch (erreur) {
    console.error("Correction TD impossible :", erreur.message);
    return refuser(res, 500, "Erreur interne du serveur.");
  }
});

module.exports = router;
