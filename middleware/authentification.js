/*
 * middleware/authentification.js
 * Contrôle d'accès : qui est connecté, qui a un compte validé, qui est admin.
 *
 * Pourquoi ces middlewares : la protection ne doit pas être seulement dans le
 * navigateur. Un utilisateur peut taper une adresse directement ou appeler
 * l'API avec curl. C'est donc le serveur qui décide, à chaque requête.
 */

const base = require("../db/connexion");

// Message exact demandé pour un compte en attente de validation.
const MESSAGE_ATTENTE = "Votre inscription est en cours de validation";

// Nom du cookie de session. Il est centralisé pour que la création et la
// suppression du cookie utilisent exactement le même nom.
const NOM_COOKIE = "revision-p13.sid";

// Requête préparée une seule fois : les ? seront remplacés en toute sécurité.
const rechercheUtilisateur = base.prepare(
  "SELECT id, pseudo, whatsapp, statut, role FROM users WHERE id = ?"
);

// Charge l'utilisateur à partir de l'identifiant gardé dans la session.
function chargerUtilisateur(req, res, suite) {
  req.utilisateur = null;

  const id = req.session && req.session.utilisateurId;
  if (!id) {
    return suite();
  }

  try {
    req.utilisateur = rechercheUtilisateur.get(id) || null;
  } catch (erreur) {
    // On ne renvoie jamais le détail technique de l'erreur au navigateur.
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }

  suite();
}

// Une requête pour une page HTML doit être redirigée ; une requête API reçoit
// du JSON. On distingue les deux pour garder une interface agréable.
function estUnePage(req) {
  // req.path est relatif au point de montage Express : dans /api/rappels il
  // vaut "/" pour la liste, ce qui déclencherait une redirection HTML.
  // originalUrl garde l'adresse complète, donc une requête API reçoit du JSON.
  const chemin = req.originalUrl.split("?")[0];
  return chemin.endsWith(".html") || chemin === "/";
}

function refuser(req, res, statut, message, redirection) {
  if (estUnePage(req)) {
    return res.redirect(redirection);
  }
  return res.status(statut).json({ erreur: message });
}

function exigerConnexion(req, res, suite) {
  if (!req.utilisateur) {
    return refuser(
      req,
      res,
      401,
      "Connectez-vous pour accéder à cette page.",
      "/connexion.html"
    );
  }
  suite();
}

function exigerStatutValide(req, res, suite) {
  if (req.utilisateur.statut === "en_attente") {
    return refuser(req, res, 403, MESSAGE_ATTENTE, "/en-attente.html");
  }

  if (req.utilisateur.statut === "refuse") {
    return refuser(
      req,
      res,
      403,
      "Accès refusé.",
      "/connexion.html"
    );
  }

  suite();
}

function exigerAdmin(req, res, suite) {
  if (req.utilisateur.role !== "admin") {
    return refuser(req, res, 403, "Accès réservé à l'administrateur.", "/accueil.html");
  }
  suite();
}

module.exports = {
  NOM_COOKIE,
  MESSAGE_ATTENTE,
  chargerUtilisateur,
  exigerConnexion,
  exigerStatutValide,
  exigerAdmin,
};
