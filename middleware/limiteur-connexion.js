/*
 * middleware/limiteur-connexion.js
 * Limite le nombre d'essais de connexion pour éviter qu'un robot devine un mot
 * de passe en essayant des milliers de combinaisons.
 *
 * Pourquoi une table SQLite : on compte par numéro ET par adresse IP, et les
 * compteurs survivent à un redémarrage du serveur. Aucune librairie supplémentaire
 * n'est nécessaire.
 *
 * Les messages restent volontairement génériques : on ne dit jamais si le
 * numéro existe ou combien d'essais il reste à l'attaquant.
 */

const base = require("../db/connexion");
const { nettoyerNumero } = require("./validation");

const NOMBRE_MAX_ESSAIS = 5;
const DUREE_BLOCAGE = 15 * 60 * 1000; // 15 minutes.

const lecture = base.prepare(
  "SELECT tentatives, bloque_jusqu_a FROM tentatives_connexion WHERE cle = ?"
);

// Toutes les valeurs variables sont passées avec des ? : aucune concaténation
// de texte venant de l'utilisateur dans une requête SQL.
const ajoutEchec = base.prepare(
  `INSERT INTO tentatives_connexion (cle, tentatives, bloque_jusqu_a)
   VALUES (?, 1, 0)
   ON CONFLICT(cle) DO UPDATE SET
     tentatives = CASE
       WHEN tentatives_connexion.tentatives + 1 >= ? THEN 0
       ELSE tentatives_connexion.tentatives + 1
     END,
     bloque_jusqu_a = CASE
       WHEN tentatives_connexion.tentatives + 1 >= ? THEN ?
       ELSE tentatives_connexion.bloque_jusqu_a
     END`
);

const suppression = base.prepare(
  "DELETE FROM tentatives_connexion WHERE cle = ?"
);

// Clé composée : un même numéro depuis deux machines différentes est compté
// séparément, et une même machine qui essaie plusieurs numéros est limitée.
function clePour(req) {
  const numero = nettoyerNumero(req.body && req.body.whatsapp);
  return `${req.ip}:${numero}`;
}

function verifierLimite(req, res, suite) {
  const numero = nettoyerNumero(req.body && req.body.whatsapp);

  // Si le numéro est invalide, la route renverra son message habituel : on ne
  // bloque pas ici pour ne pas révéler une différence de traitement.
  if (numero) {
    const ligne = lecture.get(clePour(req));
    if (ligne && ligne.bloque_jusqu_a > Date.now()) {
      return res.status(429).json({
        erreur: "Trop de tentatives. Réessayez dans quelques minutes.",
      });
    }
  }

  suite();
}

function enregistrerEchec(req) {
  ajoutEchec.run(
    clePour(req),
    NOMBRE_MAX_ESSAIS,
    NOMBRE_MAX_ESSAIS,
    Date.now() + DUREE_BLOCAGE
  );
}

function reinitialiser(req) {
  suppression.run(clePour(req));
}

module.exports = {
  verifierLimite,
  enregistrerEchec,
  reinitialiser,
};
