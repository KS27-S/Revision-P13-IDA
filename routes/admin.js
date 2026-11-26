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
const {
  validerIdentifiant,
  validerDureeMois,
} = require("../middleware/validation");
const {
  mettreAJourAbonnementsExpires,
  creerAbonnement,
  prolongerAbonnement,
  joursRestants,
} = require("../services/abonnements");

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

// ---------------------------------------------------------------------------
// Abonnements : l'admin vérifie le paiement Wave puis active l'accès à la main.
// ---------------------------------------------------------------------------

// Liste des étudiants validés : on ne peut abonner que quelqu'un dont le compte
// a été accepté (un compte en attente n'a accès à aucun contenu).
router.get("/utilisateurs-valides", (req, res) => {
  try {
    const utilisateurs = base
      .prepare(
        `SELECT id, pseudo, whatsapp FROM users
         WHERE statut = 'valide' ORDER BY pseudo, id`
      )
      .all();
    return res.json({ utilisateurs });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

// Liste des offres pour le formulaire d'activation.
router.get("/offres", (req, res) => {
  try {
    const offres = base
      .prepare(
        `SELECT id, nom, prix_fcfa, duree_mois FROM offres ORDER BY prix_fcfa`
      )
      .all();
    return res.json({ offres });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

/*
 * Historique complet des abonnements. "expire_bientot" est seulement un repère
 * visuel pour l'admin (7 jours) : ce n'est pas une règle du cahier des charges.
 */
router.get("/abonnements", (req, res) => {
  try {
    mettreAJourAbonnementsExpires();
    const abonnements = base
      .prepare(
        `SELECT a.id, a.utilisateur_id, a.offre_id, a.date_debut, a.date_fin,
                a.statut, a.reference_paiement,
                u.pseudo, u.whatsapp, o.nom AS offre_nom
         FROM abonnements a
         JOIN users u ON u.id = a.utilisateur_id
         JOIN offres o ON o.id = a.offre_id
         ORDER BY a.date_debut DESC, a.id DESC`
      )
      .all()
      .map(function (ligne) {
        const restants = joursRestants(ligne.date_fin);
        return {
          ...ligne,
          joursRestants: restants,
          expireBientot: ligne.statut === "actif" && restants <= 7,
        };
      });

    return res.json({ abonnements });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

/*
 * Active un abonnement. Les trois vérifications (utilisateur validé, offre
 * connue, durée correcte) sont faites ici, côté serveur : le formulaire HTML
 * peut être modifié par n'importe qui.
 */
router.post("/abonnements", (req, res) => {
  const corps = req.body || {};
  const utilisateurId = validerIdentifiant(corps.utilisateurId);
  const offreId = validerIdentifiant(corps.offreId);
  const dureeMois = validerDureeMois(corps.dureeMois);

  if (!utilisateurId || !offreId || !dureeMois) {
    return res.status(400).json({ erreur: "Informations d'abonnement invalides." });
  }

  try {
    const utilisateur = base
      .prepare("SELECT id, statut FROM users WHERE id = ?")
      .get(utilisateurId);
    if (!utilisateur || utilisateur.statut !== "valide") {
      return res
        .status(400)
        .json({ erreur: "Choisissez un étudiant dont le compte est validé." });
    }

    const offre = base.prepare("SELECT id FROM offres WHERE id = ?").get(offreId);
    if (!offre) {
      return res.status(400).json({ erreur: "Offre inconnue." });
    }

    // La référence Wave est facultative : elle est gardée pour tracer le
    // paiement vérifié par l'admin, sans rendre l'activation obligatoire.
    const reference =
      typeof corps.referencePaiement === "string"
        ? corps.referencePaiement.trim().slice(0, 100)
        : "";

    const id = creerAbonnement(utilisateurId, offreId, dureeMois, reference);
    return res.status(201).json({ message: "Abonnement activé.", id });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

// Prolongation : on repart de la date de fin de l'abonnement choisi.
router.post("/abonnements/:id/prolonger", (req, res) => {
  const id = validerIdentifiant(req.params.id);
  const dureeMois = validerDureeMois((req.body || {}).dureeMois);
  if (!id || !dureeMois) {
    return res.status(400).json({ erreur: "Prolongation invalide." });
  }

  try {
    const nouvelId = prolongerAbonnement(id, dureeMois);
    if (!nouvelId) {
      return res.status(404).json({ erreur: "Abonnement introuvable." });
    }
    return res.status(201).json({ message: "Abonnement prolongé.", id: nouvelId });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

module.exports = router;
