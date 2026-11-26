/*
 * routes/abonnements.js
 * Vue de l'étudiant sur son propre abonnement. Le serveur calcule les jours
 * restants : le navigateur n'a qu'à afficher le résultat.
 */

const express = require("express");
const {
  exigerConnexion,
  exigerStatutValide,
} = require("../middleware/authentification");
const {
  obtenirAbonnementActif,
  obtenirHistorique,
  joursRestants,
} = require("../services/abonnements");
const { offresQuiDonnentAcces } = require("../services/acces");

const router = express.Router();
router.use(exigerConnexion, exigerStatutValide);

router.get("/mon-abonnement", (req, res) => {
  try {
    const actif = obtenirAbonnementActif(req.utilisateur.id);
    const historique = obtenirHistorique(req.utilisateur.id).map(function (ligne) {
      return {
        id: ligne.id,
        offreNom: ligne.offre_nom,
        dateDebut: ligne.date_debut,
        dateFin: ligne.date_fin,
        statut: ligne.statut,
        joursRestants: joursRestants(ligne.date_fin),
        referencePaiement: ligne.reference_paiement,
      };
    });

    return res.json({
      abonnement: actif
        ? {
            id: actif.id,
            offreNom: actif.offre_nom,
            offreSlug: actif.offre_slug,
            prixFcfa: actif.prix_fcfa,
            dateDebut: actif.date_debut,
            dateFin: actif.date_fin,
            joursRestants: joursRestants(actif.date_fin),
            referencePaiement: actif.reference_paiement,
          }
        : null,
      historique,
      // Toutes les offres incluent les quiz : cette liste sert de proposition
      // quand l'étudiant n'a pas (ou plus) d'abonnement.
      offres: offresQuiDonnentAcces("quiz"),
    });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

module.exports = router;
