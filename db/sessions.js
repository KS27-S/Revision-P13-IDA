/*
 * db/sessions.js
 * Stockage des sessions dans SQLite pour express-session.
 *
 * Pourquoi ce fichier : express-session fournit un stockage en mémoire qui
 * disparaît au redémarrage et qui n'est pas conseillé en production. Plutôt
 * que d'ajouter une librairie de plus, on utilise la base SQLite déjà présente.
 *
 * Le cookie du navigateur contient seulement un identifiant aléatoire (sid).
 * Les informations de la session restent ici, côté serveur.
 */

const session = require("express-session");
const base = require("./connexion");

const DUREE_PAR_DEFAUT = 2 * 60 * 60 * 1000; // 2 heures, en millisecondes.

class MagasinSessionsSQLite extends session.Store {
  constructor() {
    super();

    // De temps en temps on supprime les sessions expirées pour que la table ne
    // grossisse pas indéfiniment. unref() permet au serveur de s'arrêter quand
    // même si ce minuteur tourne encore.
    this.minuteur = setInterval(() => this.supprimerExpirees(), 60 * 60 * 1000);
    this.minuteur.unref();
  }

  // Date d'expiration en millisecondes, lue dans cookie.expires quand elle existe.
  expiration(sessionData) {
    if (sessionData.cookie && sessionData.cookie.expires) {
      return new Date(sessionData.cookie.expires).getTime();
    }
    return Date.now() + DUREE_PAR_DEFAUT;
  }

  // Appelé par express-session pour retrouver une session à partir du cookie.
  get(sid, callback) {
    try {
      const ligne = base
        .prepare("SELECT donnees, expire_le FROM sessions WHERE sid = ?")
        .get(sid);

      if (!ligne) {
        return callback(null, null);
      }

      if (ligne.expire_le <= Date.now()) {
        base.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
        return callback(null, null);
      }

      callback(null, JSON.parse(ligne.donnees));
    } catch (erreur) {
      callback(erreur);
    }
  }

  // Appelé à la connexion, puis à chaque modification de la session.
  set(sid, sessionData, callback) {
    try {
      const expireLe = this.expiration(sessionData);
      const donnees = JSON.stringify(sessionData);

      // INSERT ... ON CONFLICT met à jour la ligne existante s'il y en a une.
      base
        .prepare(
          `INSERT INTO sessions (sid, donnees, expire_le)
           VALUES (?, ?, ?)
           ON CONFLICT(sid) DO UPDATE SET donnees = excluded.donnees,
                                          expire_le = excluded.expire_le`
        )
        .run(sid, donnees, expireLe);
      callback(null);
    } catch (erreur) {
      callback(erreur);
    }
  }

  // Appelé à la déconnexion : on efface la session côté serveur.
  destroy(sid, callback) {
    try {
      base.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
      callback(null);
    } catch (erreur) {
      callback(erreur);
    }
  }

  // Quand l'utilisateur reste actif, express-session prolonge le cookie.
  touch(sid, sessionData, callback) {
    try {
      base
        .prepare("UPDATE sessions SET expire_le = ? WHERE sid = ?")
        .run(this.expiration(sessionData), sid);
      callback(null);
    } catch (erreur) {
      callback(erreur);
    }
  }

  supprimerExpirees() {
    base.prepare("DELETE FROM sessions WHERE expire_le <= ?").run(Date.now());
  }
}

module.exports = MagasinSessionsSQLite;
