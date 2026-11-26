/*
 * routes/admin-contenu.js
 * Tableau de suivi et publication des contenus, réservé à l'administrateur.
 *
 * Rien n'est publié automatiquement : l'import crée des brouillons et l'admin
 * décide. Le bouton "Tout publier" passe par toutPublier(), qui refuse les
 * contenus vides, incomplets ou verrouillés.
 */

const express = require("express");
const base = require("../db/connexion");
const {
  exigerConnexion,
  exigerStatutValide,
  exigerAdmin,
} = require("../middleware/authentification");
const { validerIdentifiant } = require("../middleware/validation");
const {
  listerContenus,
  publierContenu,
  depublierContenu,
  verrouillerContenu,
  toutPublier,
} = require("../services/suivi-contenu");

const router = express.Router();
const TYPES = ["rappel", "quiz", "td"];

router.use(exigerConnexion, exigerStatutValide, exigerAdmin);
router.use(function (req, res, suite) {
  if (req.method === "POST" && !req.is("application/json")) {
    return res.status(415).json({ erreur: "Corps JSON attendu." });
  }
  return suite();
});

router.get("/contenus", (req, res) => {
  try {
    const contenus = listerContenus(base);
    return res.json({
      contenus,
      resume: {
        vide: contenus.filter((contenu) => contenu.statut === "vide").length,
        brouillon: contenus.filter((contenu) => contenu.statut === "brouillon").length,
        publie: contenus.filter((contenu) => contenu.statut === "publie").length,
        incomplet: contenus.filter((contenu) => !contenu.complet).length,
      },
    });
  } catch (erreur) {
    console.error("Suivi contenu impossible :", erreur.message);
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

// attention : cette route doit rester avant "/contenus/:type/:moduleId/..."
router.post("/contenus/tout-publier", (req, res) => {
  try {
    const resultat = toutPublier(base);
    return res.json({ ...resultat, contenus: listerContenus(base) });
  } catch (erreur) {
    console.error("Publication globale impossible :", erreur.message);
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

function verifierParametres(req, res) {
  const type = req.params.type;
  const moduleId = validerIdentifiant(req.params.moduleId);
  if (!TYPES.includes(type) || !moduleId) {
    res.status(400).json({ erreur: "Type ou module invalide." });
    return null;
  }
  return { type, moduleId };
}

router.post("/contenus/:type/:moduleId/publier", (req, res) => {
  const parametres = verifierParametres(req, res);
  if (!parametres) {
    return;
  }
  try {
    const resultat = publierContenu(base, parametres.type, parametres.moduleId);
    if (resultat.erreur) {
      return res.status(400).json(resultat);
    }
    return res.json({ ok: true, contenus: listerContenus(base) });
  } catch (erreur) {
    console.error("Publication impossible :", erreur.message);
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

router.post("/contenus/:type/:moduleId/depublier", (req, res) => {
  const parametres = verifierParametres(req, res);
  if (!parametres) {
    return;
  }
  try {
    const resultat = depublierContenu(base, parametres.type, parametres.moduleId);
    if (resultat.erreur) {
      return res.status(400).json(resultat);
    }
    return res.json({ ok: true, contenus: listerContenus(base) });
  } catch (erreur) {
    console.error("Dépublication impossible :", erreur.message);
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

router.post("/contenus/:type/:moduleId/verrouiller", (req, res) => {
  const parametres = verifierParametres(req, res);
  if (!parametres) {
    return;
  }
  try {
    const resultat = verrouillerContenu(base, parametres.type, parametres.moduleId, true);
    if (resultat.erreur) {
      return res.status(400).json(resultat);
    }
    return res.json({ ok: true, contenus: listerContenus(base) });
  } catch (erreur) {
    console.error("Verrouillage impossible :", erreur.message);
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

router.post("/contenus/:type/:moduleId/deverrouiller", (req, res) => {
  const parametres = verifierParametres(req, res);
  if (!parametres) {
    return;
  }
  try {
    const resultat = verrouillerContenu(base, parametres.type, parametres.moduleId, false);
    if (resultat.erreur) {
      return res.status(400).json(resultat);
    }
    return res.json({ ok: true, contenus: listerContenus(base) });
  } catch (erreur) {
    console.error("Déverrouillage impossible :", erreur.message);
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

module.exports = router;
