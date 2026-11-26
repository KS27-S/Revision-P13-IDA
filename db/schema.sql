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

-- ---------------------------------------------------------------------------
-- Contenu pédagogique et abonnements (cahier des charges, sections 3 et 4.5).
-- Ces tables sont créées avec IF NOT EXISTS : relancer le serveur ou un script
-- ne supprime jamais les données déjà saisies.
-- ---------------------------------------------------------------------------

-- Les 8 matières de la promotion, dans l'ordre où elles apparaissent dans
-- revision.html. "slug" est l'identifiant court utilisé par le front
-- (algorithmique, html-css, ...).
CREATE TABLE IF NOT EXISTS matieres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  ordre_affichage INTEGER NOT NULL DEFAULT 0
);

-- Les 37 modules : chaque module appartient à une matière et porte un numéro
-- d'ordre. "offert" vaut 1 pour le premier module de chaque matière : c'est la
-- gratuité décrite dans le cahier (8 modules sur 37, rappel + quiz + TD).
CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matiere_id INTEGER NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  titre TEXT NOT NULL,
  ordre_affichage INTEGER NOT NULL,
  offert INTEGER NOT NULL DEFAULT 0 CHECK (offert IN (0, 1)),
  UNIQUE (matiere_id, slug)
);

-- Les rappels de cours sont stockés ici, et non plus dans le HTML : le serveur
-- peut ainsi refuser d'envoyer le contenu d'un module non autorisé.
CREATE TABLE IF NOT EXISTS rappels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL UNIQUE REFERENCES modules(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  contenu_html TEXT NOT NULL,
  date_creation TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Les trois offres payantes du cahier : 500, 1 000 et 2 000 F par mois.
-- Les colonnes "inclut_*" traduisent exactement ce que le cahier énumère.
-- Le quota IA est conservé pour la phase 3 (l'assistant n'est pas encore fait).
CREATE TABLE IF NOT EXISTS offres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  prix_fcfa INTEGER NOT NULL,
  duree_mois INTEGER NOT NULL DEFAULT 1,
  inclut_quiz INTEGER NOT NULL DEFAULT 0 CHECK (inclut_quiz IN (0, 1)),
  inclut_rappel INTEGER NOT NULL DEFAULT 0 CHECK (inclut_rappel IN (0, 1)),
  inclut_td INTEGER NOT NULL DEFAULT 0 CHECK (inclut_td IN (0, 1)),
  messages_ia_par_jour INTEGER NOT NULL DEFAULT 10
);

-- Un abonnement garde toutes ses versions dans le temps : c'est cela qui sert
-- d'historique. Les statuts possibles sont :
--   actif     : l'accès est ouvert jusqu'à date_fin ;
--   expire    : la date de fin est passée (mise à jour automatiquement) ;
--   remplace  : un nouvel abonnement a pris le relais (prolongation ou changement).
CREATE TABLE IF NOT EXISTS abonnements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offre_id INTEGER NOT NULL REFERENCES offres(id),
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'actif'
    CHECK (statut IN ('actif', 'expire', 'remplace')),
  -- Référence du paiement Wave vérifié par l'admin ; facultative au démarrage.
  reference_paiement TEXT,
  date_creation TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS index_abonnements_utilisateur
  ON abonnements(utilisateur_id);
CREATE INDEX IF NOT EXISTS index_abonnements_statut
  ON abonnements(statut);

-- ---------------------------------------------------------------------------
-- Suivi éditorial et moteur de quiz (cahier 3.2, 4.2 et 4.4).
--
-- Migration : toutes les tables ci-dessous utilisent CREATE TABLE IF NOT EXISTS.
-- Relancer le serveur ou l'import ne supprime donc aucune donnée déjà saisie.
-- Les tables anciennes (users, rappels, abonnements...) ne sont pas modifiées :
-- les 8 rappels déjà présents gardent exactement leur titre et leur HTML.
-- ---------------------------------------------------------------------------

-- Une ligne par module ET par type de contenu. C'est ici que vit le statut
-- 'vide' / 'brouillon' / 'publie' demandé pour le tableau de suivi admin.
-- "verrouille" permet à l'admin d'empêcher l'import d'écraser une version
-- corrigée à la main : le script d'import le vérifie avant toute mise à jour.
CREATE TABLE IF NOT EXISTS contenus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('rappel', 'quiz', 'td')),
  statut TEXT NOT NULL DEFAULT 'vide'
    CHECK (statut IN ('vide', 'brouillon', 'publie')),
  verrouille INTEGER NOT NULL DEFAULT 0 CHECK (verrouille IN (0, 1)),
  source_hash TEXT NOT NULL DEFAULT '',
  date_maj TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (module_id, type)
);

-- Les quiz importés des fichiers .quiz.json. On garde le JSON des sources
-- uniquement pour information : il n'est jamais envoyé tel quel au navigateur.
CREATE TABLE IF NOT EXISTS quiz (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL UNIQUE REFERENCES modules(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  sources_json TEXT NOT NULL DEFAULT '[]',
  source_hash TEXT NOT NULL DEFAULT '',
  date_creation TEXT NOT NULL DEFAULT (datetime('now')),
  date_modification TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Les 20 questions d'un quiz. La bonne réponse et l'explication restent ici,
-- côté serveur : les routes de jeu ne les renvoient qu'après la correction.
CREATE TABLE IF NOT EXISTS questions_quiz (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  question_ref TEXT NOT NULL,
  niveau TEXT NOT NULL CHECK (niveau IN ('facile', 'moyen', 'difficile')),
  enonce TEXT NOT NULL,
  choix_json TEXT NOT NULL,
  reponse_index INTEGER NOT NULL CHECK (reponse_index BETWEEN 0 AND 3),
  explication TEXT NOT NULL,
  code_source TEXT,
  ordre_original INTEGER NOT NULL,
  UNIQUE (quiz_id, question_ref)
);

-- Les TD importés des fichiers .td.json. Chaque exercice est gardé dans son
-- format d'origine (donnees_json) pour ne rien réécrire du contenu existant.
CREATE TABLE IF NOT EXISTS td (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL UNIQUE REFERENCES modules(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  source_hash TEXT NOT NULL DEFAULT '',
  date_creation TEXT NOT NULL DEFAULT (datetime('now')),
  date_modification TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercices_td (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  td_id INTEGER NOT NULL REFERENCES td(id) ON DELETE CASCADE,
  exercice_ref TEXT NOT NULL,
  type TEXT NOT NULL,
  donnees_json TEXT NOT NULL,
  ordre_original INTEGER NOT NULL,
  UNIQUE (td_id, exercice_ref)
);

-- Chaque tentative est enregistrée côté serveur : c'est la seule façon sûre
-- d'appliquer 3 tentatives, puis 2 après 12 heures, et d'empêcher la triche.
-- questions_json contient l'ordre mélangé des questions et des options, sans
-- jamais les bonnes réponses. correction_json n'est rempli qu'à la soumission.
CREATE TABLE IF NOT EXISTS tentatives_quiz (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  cycle INTEGER NOT NULL DEFAULT 1,
  numero_tentative INTEGER NOT NULL,
  questions_json TEXT NOT NULL,
  reponses_json TEXT,
  correction_json TEXT,
  score INTEGER,
  total INTEGER NOT NULL DEFAULT 20,
  reussi INTEGER,
  valide_module INTEGER,
  date_debut TEXT NOT NULL DEFAULT (datetime('now')),
  date_fin TEXT,
  date_fin_ms INTEGER,
  UNIQUE (utilisateur_id, module_id, numero_tentative)
);

CREATE INDEX IF NOT EXISTS index_tentatives_utilisateur_module
  ON tentatives_quiz(utilisateur_id, module_id);

-- Dépôt d'un TD : on enregistre la réponse de l'étudiant, sans correction IA.
-- L'emplacement de la future vérification est indiqué dans routes/td.js.
CREATE TABLE IF NOT EXISTS rendus_td (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  exercice_ref TEXT NOT NULL,
  contenu TEXT NOT NULL,
  date_envoi TEXT NOT NULL DEFAULT (datetime('now')),
  statut_validation TEXT NOT NULL DEFAULT 'non_evalue'
    CHECK (statut_validation IN ('non_evalue', 'accepte', 'refuse')),
  message_validation TEXT
);

CREATE INDEX IF NOT EXISTS index_rendus_utilisateur_module
  ON rendus_td(utilisateur_id, module_id);
