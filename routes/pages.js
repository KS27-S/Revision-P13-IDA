/*
 * routes/pages.js
 * Protection des pages HTML sensibles.
 *
 * Ces routes sont enregistrées AVANT le dossier statique dans server.js :
 * sans cela, Express donnerait le fichier directement et le contrôle d'accès
 * serait contourné. Le navigateur n'est jamais considéré comme fiable.
 */

const express = require("express");
const path = require("node:path");
const {
  chargerUtilisateur,
  exigerConnexion,
  exigerStatutValide,
  exigerAdmin,
} = require("../middleware/authentification");

const router = express.Router();
const dossierPublic = path.join(__dirname, "..", "public");

// Ce routeur ne s'occupe que des pages protégées : on y charge l'utilisateur
// avant de vérifier son statut et son rôle.
router.use(chargerUtilisateur);

function envoyerPage(nomFichier) {
  return (req, res) => res.sendFile(path.join(dossierPublic, nomFichier));
}

// Espace étudiant : réservé aux comptes validés.
router.get(
  "/espace-etudiant.html",
  exigerConnexion,
  exigerStatutValide,
  envoyerPage("espace-etudiant.html")
);

// Page d'administration : réservée au rôle admin, en plus du statut valide.
router.get(
  "/admin.html",
  exigerConnexion,
  exigerStatutValide,
  exigerAdmin,
  envoyerPage("admin.html")
);

module.exports = router;
