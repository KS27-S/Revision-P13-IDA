/*
 * routes/rappels.js
 * API des rappels de cours. Le texte des fiches n'est plus dans le HTML : il
 * vient de la table "rappels" et n'est envoyé que si peutAcceder le permet.
 *
 * Deux barrières protègent l'API :
 *  1. exigerConnexion + exigerStatutValide refusent les anonymes et les comptes
 *     non validés, y compris pour le contenu gratuit (article 02) ;
 *  2. peutAcceder applique ensuite modules offerts et abonnements.
 *
 * La liste (GET /api/rappels) ne contient jamais de cours : seulement les
 * titres et un drapeau "accessible". Le contenu se charge à la demande avec
 * GET /api/rappels/:id quand l'étudiant ouvre une fiche.
 */

const express = require("express");
const base = require("../db/connexion");
const { peutAcceder, offresQuiDonnentAcces } = require("../services/acces");
const { validerIdentifiant } = require("../middleware/validation");
const {
  exigerConnexion,
  exigerStatutValide,
} = require("../middleware/authentification");

const router = express.Router();

/*
 * Un rappel n'est affiché que si l'admin l'a publié. Si aucune ligne de suivi
 * n'existe encore (base non importée), on garde le comportement historique :
 * les 8 fiches déjà en base restent lisibles, on ne casse rien d'existant.
 */
function estPublie(moduleId) {
  const ligne = base
    .prepare("SELECT statut FROM contenus WHERE module_id = ? AND type = 'rappel'")
    .get(moduleId);
  return !ligne || ligne.statut === "publie";
}

// Premier contrôle, avant même de lire la base : sans compte connecté et validé,
// aucune requête ne passe. Un anonyme reçoit 401, un compte en attente ou refusé
// reçoit 403 avec un message court. Ainsi aucun texte de cours ne peut sortir,
// même pour un module offert. peutAcceder reste en deuxième couche pour les
// règles de gratuité et d'abonnement.
router.use(exigerConnexion, exigerStatutValide);

// 1. Liste des fiches. req.utilisateur est rempli par chargerUtilisateur dans
// server.js, puis vérifié par le middleware ci-dessus : ici, il est forcément
// un compte connecté et validé.
router.get("/", (req, res) => {
  try {
    const lignes = base
      .prepare(
        `SELECT r.id, r.titre, m.id AS module_id, m.slug AS module_slug,
                m.titre AS module_titre, m.offert,
                mat.nom AS matiere_nom, mat.slug AS matiere_slug
         FROM rappels r
         JOIN modules m ON m.id = r.module_id
         JOIN matieres mat ON mat.id = m.matiere_id
         ORDER BY mat.ordre_affichage, m.ordre_affichage`
      )
      .all();

    const rappels = lignes.map(function (ligne) {
      const acces = peutAcceder(req.utilisateur, ligne, "rappel");
      const publie = estPublie(ligne.module_id);
      return {
        id: ligne.id,
        moduleId: ligne.module_id,
        moduleSlug: ligne.module_slug,
        titre: ligne.titre,
        matiere: ligne.matiere_nom,
        matiereSlug: ligne.matiere_slug,
        offert: Boolean(ligne.offert),
        accessible: acces.autorise && publie,
        raison: acces.autorise
          ? publie
            ? ""
            : "Ce rappel n'est pas encore publié."
          : acces.raison,
      };
    });

    return res.json({ rappels, offres: offresQuiDonnentAcces("rappel") });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

// 2. Contenu d'une fiche. On lit d'abord les informations sans le texte, on
// vérifie l'accès, et seulement ensuite on va chercher contenu_html : ainsi le
// texte payant ne quitte jamais le serveur quand l'accès est refusé.
router.get("/:id", (req, res) => {
  const id = validerIdentifiant(req.params.id);
  if (!id) {
    return res.status(400).json({ erreur: "Identifiant invalide." });
  }

  try {
    const meta = base
      .prepare(
        `SELECT r.id, r.titre, m.id AS module_id, m.slug AS module_slug,
                m.titre AS module_titre, m.offert,
                mat.nom AS matiere_nom
         FROM rappels r
         JOIN modules m ON m.id = r.module_id
         JOIN matieres mat ON mat.id = m.matiere_id
         WHERE r.id = ?`
      )
      .get(id);

    if (!meta) {
      return res.status(404).json({ erreur: "Rappel introuvable." });
    }

    const acces = peutAcceder(req.utilisateur, meta, "rappel");
    if (!acces.autorise) {
      // Réponse volontairement sans "contenuHtml" : c'est la règle du sujet.
      return res.status(403).json({
        erreur: acces.raison,
        accessible: false,
        offres: acces.offres,
      });
    }
    if (!estPublie(meta.module_id)) {
      return res.status(403).json({
        erreur: "Ce rappel n'est pas encore publié.",
        accessible: false,
      });
    }

    const rappel = base
      .prepare("SELECT id, contenu_html FROM rappels WHERE id = ?")
      .get(id);

    return res.json({
      accessible: true,
      id: rappel.id,
      titre: meta.titre,
      matiere: meta.matiere_nom,
      moduleSlug: meta.module_slug,
      moduleTitre: meta.module_titre,
      contenuHtml: rappel.contenu_html,
    });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

module.exports = router;
