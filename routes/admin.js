/*
 * routes/admin.js
 * Espace administrateur : liste des inscriptions et décisions valider/refuser.
 *
 * Toutes les routes de ce fichier passent par trois protections :
 *   1. être connecté ;
 *   2. avoir un compte validé ;
 *   3. avoir le rôle admin.
 * Sans cela, n'importe quel étudiant pourrait valider son propre compte.
 */

const express = require("express");
const base = require("../db/connexion");
const {
  exigerConnexion,
  exigerStatutValide,
  exigerAdmin,
} = require("../middleware/authentification");
const { validerIdentifiant } = require("../middleware/validation");

const router = express.Router();
router.use(exigerConnexion, exigerStatutValide, exigerAdmin);

router.use((req, res, suite) => {
  if (req.method === "POST" && !req.is("application/json")) {
    return res.status(415).json({ erreur: "Format de requête non accepté." });
  }
  suite();
});

const STATUTS = ["en_attente", "valide", "refuse"];

// Liste des demandes. Par défaut on affiche celles qui attendent une décision.
router.get("/inscriptions", (req, res) => {
  const statut =
    typeof req.query.statut === "string" ? req.query.statut : "en_attente";

  if (!STATUTS.includes(statut)) {
    return res.status(400).json({ erreur: "Statut inconnu." });
  }

  try {
    // EXISTS permet de dire si le numéro a été vérifié sans ajouter de colonne
    // à la table users demandée dans le sujet.
    const inscriptions = base
      .prepare(
        `SELECT u.id, u.pseudo, u.whatsapp, u.date_creation,
                EXISTS(
                  SELECT 1 FROM verification_codes vc
                  WHERE vc.utilisateur_id = u.id AND vc.utilise = 1
                ) AS numero_verifie
         FROM users u
         WHERE u.statut = ?
         ORDER BY u.date_creation, u.id`
      )
      .all(statut);

    return res.json({ inscriptions });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

// Fonction commune aux deux décisions : on ne modifie que les comptes encore
// en attente, pour éviter de changer le statut d'un compte déjà traité.
function decider(req, res, nouveauStatut) {
  const id = validerIdentifiant(req.params.id);
  if (!id) {
    return res.status(400).json({ erreur: "Identifiant invalide." });
  }

  try {
    const resultat = base
      .prepare(
        "UPDATE users SET statut = ? WHERE id = ? AND statut = 'en_attente'"
      )
      .run(nouveauStatut, id);

    if (resultat.changes === 0) {
      return res.status(404).json({ erreur: "Inscription introuvable." });
    }

    return res.json({ message: "Décision enregistrée." });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
}

router.post("/inscriptions/:id/valider", (req, res) => decider(req, res, "valide"));
router.post("/inscriptions/:id/refuser", (req, res) => decider(req, res, "refuse"));

module.exports = router;
