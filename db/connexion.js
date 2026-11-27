/*
 * db/connexion.js
 * Ouvre la base SQLite une seule fois quand le serveur démarre, puis crée les
 * tables si elles n'existent pas encore.
 *
 * Pourquoi une base locale : le cahier des charges demande des comptes, des
 * rôles et une validation manuelle des inscriptions. Un fichier SQLite suffit
 * pour démarrer, sans serveur de base de données à installer.
 *
 * Pourquoi better-sqlite3 : il est synchrone (le code est plus simple à lire
 * pour apprendre) et il permet de préparer les requêtes SQL, ce qui protège
 * contre les injections. Toutes les requêtes du projet passent par .prepare().
 */

const fs = require("node:fs");
const path = require("node:path");

// dotenv lit le fichier .env et place ses valeurs dans process.env.
// On indique le chemin absolu pour que la configuration marche aussi quand on
// lance le script creer-admin depuis un autre dossier.
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const Database = require("better-sqlite3");

// Par défaut la base est dans donnees/ : ce dossier est ignoré par Git car il
// contient des données personnelles (numéros de téléphone).
const cheminRelatif =
  process.env.DB_PATH ||
  (process.env.VERCEL === "1" ? "/tmp/revision-p13.db" : "./donnees/revision-p13.db");
const cheminBase = path.resolve(__dirname, "..", cheminRelatif);

// recursive: true évite une erreur si le dossier n'existe pas encore.
fs.mkdirSync(path.dirname(cheminBase), { recursive: true });

const base = new Database(cheminBase);

// WAL écrit les modifications dans un journal séparé : c'est plus rapide et
// cela évite qu'un lecteur bloque un écrivain.
base.pragma("journal_mode = WAL");

// SQLite n'applique pas les clés étrangères par défaut. On les active pour que
// supprimer un utilisateur supprime aussi ses codes de vérification.
base.pragma("foreign_keys = ON");

// Le schéma est dans un fichier .sql distinct : on peut ainsi le lire d'un coup
// d'œil sans mélanger SQL et JavaScript.
const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
base.exec(schema);

module.exports = base;
