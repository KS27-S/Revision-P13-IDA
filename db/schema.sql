-- Schéma de la base de données de la plateforme IDA P13.
-- CREATE TABLE IF NOT EXISTS permet de relancer le serveur sans écraser les données.

-- Table principale demandée dans le sujet : un compte par numéro WhatsApp.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo TEXT NOT NULL,
  whatsapp TEXT NOT NULL UNIQUE,
  -- On stocke uniquement le résultat de bcrypt, jamais le mot de passe en clair.
  mot_de_passe_hache TEXT NOT NULL,
  -- CHECK empêche la base de contenir un statut ou un rôle inventé par erreur.
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'valide', 'refuse')),
  role TEXT NOT NULL DEFAULT 'etudiant'
    CHECK (role IN ('etudiant', 'admin')),
  date_creation TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Codes envoyés au moment de l'inscription. On garde une empreinte du code
-- (et non le code lui-même) : si la base fuit, les codes ne sont pas réutilisables.
CREATE TABLE IF NOT EXISTS verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hache TEXT NOT NULL,
  -- Date en millisecondes : facile à comparer avec Date.now() en JavaScript.
  expire_le INTEGER NOT NULL,
  tentatives INTEGER NOT NULL DEFAULT 0,
  utilise INTEGER NOT NULL DEFAULT 0 CHECK (utilise IN (0, 1)),
  date_creation TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS index_codes_utilisateur
  ON verification_codes(utilisateur_id);

-- Compteurs d'échecs de connexion. On les garde en base pour qu'un redémarrage
-- du serveur ne remette pas les tentatives à zéro.
CREATE TABLE IF NOT EXISTS tentatives_connexion (
  cle TEXT PRIMARY KEY,
  tentatives INTEGER NOT NULL DEFAULT 0,
  bloque_jusqu_a INTEGER NOT NULL DEFAULT 0
);

-- Les sessions sont aussi stockées en base : un cookie ne contient qu'un
-- identifiant aléatoire, jamais le pseudo ni le rôle de l'étudiant.
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  donnees TEXT NOT NULL,
  expire_le INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS index_sessions_expiration ON sessions(expire_le);
