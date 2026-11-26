/*
 * services/acces.js
 * Décide, côté serveur, si un étudiant peut lire un contenu d'un module.
 *
 * C'est LA règle demandée dans le sujet : "peutAcceder(utilisateur, module)".
 * Le navigateur ne décide de rien : même si quelqu'un modifie le HTML ou appelle
 * l'API avec curl, c'est cette fonction qui donne ou refuse l'accès.
 *
 * Les règles viennent du cahier des charges :
 *  - un compte en attente n'accède à aucun contenu, même gratuit (4.1) ;
 *  - le premier module de chaque matière est offert (4.5) ;
 *  - sinon il faut un abonnement en cours, non expiré, dont l'offre inclut le
 *    type de contenu demandé (4.5).
 */

const base = require("../db/connexion");
const { MESSAGE_ATTENTE } = require("../middleware/authentification");
const { obtenirAbonnementActif } = require("./abonnements");

// Associe le type de contenu à la colonne correspondante de la table offres.
const COLONNES_OFFRE = {
  quiz: "inclut_quiz",
  rappel: "inclut_rappel",
  td: "inclut_td",
};

// Liste des offres qui donnent accès à ce type de contenu. Elles sont envoyées
// au front uniquement quand l'accès est refusé : c'est la "proposition de
// s'abonner" demandée dans le sujet.
function offresQuiDonnentAcces(typeContenu) {
  const colonne = COLONNES_OFFRE[typeContenu] || "inclut_rappel";
  return base
    .prepare(
      `SELECT id, slug, nom, prix_fcfa, inclut_quiz, inclut_rappel, inclut_td,
              messages_ia_par_jour
       FROM offres WHERE ${colonne} = 1 ORDER BY prix_fcfa`
    )
    .all();
}

function refuser(raison, typeContenu, proposerOffres) {
  return {
    autorise: false,
    raison,
    offres: proposerOffres ? offresQuiDonnentAcces(typeContenu) : [],
  };
}

/*
 * utilisateur : ligne de la table users (ou null si personne n'est connecté).
 * module      : ligne de la table modules.
 * typeContenu : "rappel" par défaut ; "quiz" et "td" sont prêts pour plus tard.
 * Renvoie toujours un objet avec autorise (vrai/faux), raison et offres.
 */
function peutAcceder(utilisateur, module, typeContenu = "rappel") {
  const type = COLONNES_OFFRE[typeContenu] ? typeContenu : "rappel";

  if (!utilisateur) {
    return refuser("Connectez-vous pour accéder à ce contenu.", type, false);
  }

  // Le cahier est clair : un compte non validé n'a accès à rien, gratuit compris.
  if (utilisateur.statut === "en_attente") {
    return refuser(MESSAGE_ATTENTE, type, false);
  }
  if (utilisateur.statut !== "valide") {
    return refuser("Accès refusé.", type, false);
  }

  // Gratuité : le premier module de chaque matière est ouvert à tous les
  // étudiants validés, sans abonnement.
  if (Number(module.offert) === 1) {
    return { autorise: true, raison: "Module offert.", offres: [] };
  }

  // obtenirAbonnementActif appelle miseAJourAbonnementsExpires : un abonnement
  // dont la date de fin est passée est donc traité comme inexistant.
  const abonnement = obtenirAbonnementActif(utilisateur.id);
  if (!abonnement) {
    return refuser(
      "Ce module nécessite un abonnement en cours.",
      type,
      true
    );
  }

  const colonne = COLONNES_OFFRE[type];
  if (Number(abonnement[colonne]) !== 1) {
    return refuser(
      `Votre offre actuelle n'inclut pas ce contenu (${type}).`,
      type,
      true
    );
  }

  return {
    autorise: true,
    raison: "Abonnement en cours.",
    offres: [],
    abonnement,
  };
}

module.exports = { peutAcceder, offresQuiDonnentAcces, COLONNES_OFFRE };
