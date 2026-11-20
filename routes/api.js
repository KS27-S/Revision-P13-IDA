/*
 * routes/api.js
 * Routes publiques de l'API : inscription, vérification du numéro, renvoi du
 * code, connexion, déconnexion et consultation de la session.
 *
 * Toutes les requêtes SQL utilisent des requêtes préparées (des ?), donc les
 * valeurs envoyées par le navigateur ne peuvent jamais devenir du code SQL.
 */

const express = require("express");
const bcrypt = require("bcrypt");

const base = require("../db/connexion");
const { MESSAGE_ATTENTE, NOM_COOKIE } = require("../middleware/authentification");
const {
  nettoyerNumero,
  validerInscription,
  validerConnexion,
  validerCode,
} = require("../middleware/validation");
const { verifierLimite, enregistrerEchec, reinitialiser } = require("../middleware/limiteur-connexion");
const {
  genererCodeVerification,
  hacherCode,
  comparerCode,
  envoyerCodeWhatsApp,
} = require("../services/whatsapp");

const router = express.Router();

const DUREE_CODE = 10 * 60 * 1000; // 10 minutes, comme demandé.
const NOMBRE_MAX_ESSAIS_CODE = 3;
const NOMBRES_CODES_PAR_HEURE = 3;

const MESSAGE_CONNEXION = "Identifiant ou mot de passe incorrect.";
const MESSAGE_CODE = "Code invalide ou expiré.";

const EMPREINTE_FACTICE = bcrypt.hashSync("mot-de-passe-jamais-utilise", 12);

// On exige du JSON sur les requêtes POST : cela évite qu'un simple formulaire
// d'un autre site puisse poster ici (une des protections contre le CSRF).
router.use((req, res, suite) => {
  if (req.method === "POST" && !req.is("application/json")) {
    return res.status(415).json({ erreur: "Format de requête non accepté." });
  }
  suite();
});

function erreurServeur(res) {
  return res.status(500).json({ erreur: "Erreur interne du serveur." });
}

// 1. Inscription : le compte est créé « en_attente » et un code est généré.
router.post("/inscription", async (req, res) => {
  const resultat = validerInscription(req.body || {});
  if (!resultat.valide) {
    return res.status(400).json({ erreurs: resultat.erreurs });
  }

  const { pseudo, whatsapp, motDePasse } = resultat.donnees;

  try {
    // bcrypt transforme le mot de passe en empreinte lente : même avec la base
    // volée, on ne peut pas lire les mots de passe des étudiants.
    const motDePasseHache = await bcrypt.hash(motDePasse, 12);

    const insertion = base.prepare(
      `INSERT INTO users (pseudo, whatsapp, mot_de_passe_hache)
       VALUES (?, ?, ?)`
    );

    const information = insertion.run(pseudo, whatsapp, motDePasseHache);

    const code = genererCodeVerification();
    base
      .prepare(
        `INSERT INTO verification_codes
           (utilisateur_id, code_hache, expire_le)
         VALUES (?, ?, ?)`
      )
      .run(
        information.lastInsertRowid,
        hacherCode(code),
        Date.now() + DUREE_CODE
      );

    // On ne passe que le numéro et le code à cette fonction : remplacer l'API
    // WhatsApp plus tard ne demandera aucune modification ici.
    envoyerCodeWhatsApp(whatsapp, code);

    return res.status(201).json({
      message: "Inscription enregistrée. Vérifiez votre numéro WhatsApp.",
    });
  } catch (erreur) {
    // UNIQUE empêche deux comptes avec le même numéro, même si deux requêtes
    // arrivent en même temps. Le message reste général pour ne pas divulguer
    // la liste des numéros inscrits.
    if (erreur.code && erreur.code.startsWith("SQLITE_CONSTRAINT")) {
      return res
        .status(409)
        .json({ erreur: "Un compte existe déjà avec ces informations." });
    }
    return erreurServeur(res);
  }
});

// 2. Vérification du code reçu sur le numéro WhatsApp.
router.post("/verifier-code", (req, res) => {
  const resultat = validerCode(req.body || {});
  if (!resultat.valide) {
    return res.status(400).json({ erreur: MESSAGE_CODE });
  }

  const { whatsapp, code } = resultat.donnees;

  try {
    const utilisateur = base
      .prepare("SELECT id FROM users WHERE whatsapp = ?")
      .get(whatsapp);

    if (!utilisateur) {
      return res.status(400).json({ erreur: MESSAGE_CODE });
    }

    const dernierCode = base
      .prepare(
        `SELECT id, code_hache, expire_le, tentatives
         FROM verification_codes
         WHERE utilisateur_id = ? AND utilise = 0
         ORDER BY id DESC LIMIT 1`
      )
      .get(utilisateur.id);

    if (!dernierCode || dernierCode.expire_le <= Date.now()) {
      return res.status(400).json({ erreur: MESSAGE_CODE });
    }

    if (dernierCode.tentatives >= NOMBRE_MAX_ESSAIS_CODE) {
      return res.status(429).json({ erreur: "Trop de tentatives. Demandez un nouveau code." });
    }

    if (!comparerCode(code, dernierCode.code_hache)) {
      base
        .prepare(
          "UPDATE verification_codes SET tentatives = tentatives + 1 WHERE id = ?"
        )
        .run(dernierCode.id);
      return res.status(400).json({ erreur: MESSAGE_CODE });
    }

    base
      .prepare("UPDATE verification_codes SET utilise = 1 WHERE id = ?")
      .run(dernierCode.id);

    return res.json({ message: "Numéro WhatsApp vérifié." });
  } catch (erreur) {
    return erreurServeur(res);
  }
});

// 2 bis. Nouveau code : utile si le premier a expiré ou si les 3 essais sont
// épuisés. On limite à 3 envois par numéro et par heure, comme au sujet.
router.post("/renvoyer-code", (req, res) => {
  const whatsapp = nettoyerNumero((req.body || {}).whatsapp);

  if (!whatsapp) {
    return res.status(400).json({ erreur: "Numéro WhatsApp invalide." });
  }

  try {
    const utilisateur = base
      .prepare("SELECT id FROM users WHERE whatsapp = ?")
      .get(whatsapp);

    // On répond la même chose quand le numéro est inconnu : sinon la route
    // servirait à deviner quels numéros sont inscrits.
    const MESSAGE_ENVOI = "Si ce numéro est inscrit, un nouveau code a été envoyé.";
    if (!utilisateur) {
      return res.json({ message: MESSAGE_ENVOI });
    }

    const demandes = base
      .prepare(
        `SELECT COUNT(*) AS total FROM verification_codes
         WHERE utilisateur_id = ?
           AND date_creation >= datetime('now', '-1 hour')`
      )
      .get(utilisateur.id).total;

    if (demandes >= NOMBRES_CODES_PAR_HEURE) {
      return res
        .status(429)
        .json({ erreur: "Trop de codes demandés. Réessayez dans une heure." });
    }

    const code = genererCodeVerification();
    base
      .prepare(
        `INSERT INTO verification_codes
           (utilisateur_id, code_hache, expire_le)
         VALUES (?, ?, ?)`
      )
      .run(utilisateur.id, hacherCode(code), Date.now() + DUREE_CODE);

    envoyerCodeWhatsApp(whatsapp, code);
    return res.json({ message: MESSAGE_ENVOI });
  } catch (erreur) {
    return erreurServeur(res);
  }
});

// 3. Connexion : message identique que le numéro existe ou non.
router.post("/connexion", verifierLimite, async (req, res) => {
  const resultat = validerConnexion(req.body || {});
  if (!resultat.valide) {
    enregistrerEchec(req);
    return res.status(401).json({ erreur: MESSAGE_CONNEXION });
  }

  const { whatsapp, motDePasse } = resultat.donnees;

  try {
    const utilisateur = base
      .prepare(
        `SELECT id, pseudo, statut, role, mot_de_passe_hache
         FROM users WHERE whatsapp = ?`
      )
      .get(whatsapp);

    // Quand le numéro n'existe pas, on fait tout de même un calcul bcrypt avec
    // une empreinte factice : le temps de réponse ne révèle pas l'existence du
    // compte. On la calcule une seule fois au démarrage du serveur.
    const hache = utilisateur
      ? utilisateur.mot_de_passe_hache
      : EMPREINTE_FACTICE;
    const motDePasseCorrect = await bcrypt.compare(motDePasse, hache);

    if (!utilisateur || !motDePasseCorrect) {
      enregistrerEchec(req);
      return res.status(401).json({ erreur: MESSAGE_CONNEXION });
    }

    if (utilisateur.statut === "en_attente") {
      return res.status(403).json({ erreur: MESSAGE_ATTENTE, statut: "en_attente" });
    }

    if (utilisateur.statut === "refuse") {
      return res.status(403).json({ erreur: "Accès refusé." });
    }

    reinitialiser(req);

    // regenerate change l'identifiant de session : une personne qui avait forcé
    // un cookie ne peut pas « hériter » de la session d'un autre utilisateur.
    req.session.regenerate((erreurSession) => {
      if (erreurSession) {
        return erreurServeur(res);
      }

      req.session.utilisateurId = utilisateur.id;
      return res.json({
        message: "Connexion réussie.",
        pseudo: utilisateur.pseudo,
        role: utilisateur.role,
      });
    });
  } catch (erreur) {
    return erreurServeur(res);
  }
});

// 4. Déconnexion : on détruit la session côté serveur et le cookie côté client.
router.post("/deconnexion", (req, res) => {
  req.session.destroy((erreur) => {
    if (erreur) {
      return erreurServeur(res);
    }
    res.clearCookie(NOM_COOKIE);
    return res.json({ message: "Vous êtes déconnecté." });
  });
});

// 5. État de la session : le menu du site s'en sert pour afficher soit
//    Connexion/Inscription, soit le pseudo et le bouton Déconnexion.
router.get("/session", (req, res) => {
  if (!req.utilisateur) {
    return res.json({ connecte: false });
  }

  return res.json({
    connecte: true,
    pseudo: req.utilisateur.pseudo,
    role: req.utilisateur.role,
    statut: req.utilisateur.statut,
  });
});

module.exports = router;
