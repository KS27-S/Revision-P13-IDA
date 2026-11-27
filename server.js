/*
 * server.js
 * Point d'entrée du backend : il sert les pages du dossier public/ et fournit
 * l'API sous /api.
 *
 * Pourquoi Express : c'est la librairie minimale pour recevoir des requêtes,
 * lire du JSON, poser des cookies et protéger des routes sans écrire tout le
 * serveur HTTP à la main. Les autres librairies utilisées sont chacune
 * indispensable : bcrypt (mots de passe), better-sqlite3 (base), dotenv
 * (secrets), express-session (sessions), helmet (en-têtes de sécurité).
 */

const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const session = require("express-session");

// dotenv doit être chargé avant de lire process.env. Le fichier .env n'est
// jamais versionné (voir .gitignore).
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const base = require("./db/connexion");
const MagasinSessionsSQLite = require("./db/sessions");
const {
  NOM_COOKIE,
  chargerUtilisateur,
} = require("./middleware/authentification");
const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");
const pagesRoutes = require("./routes/pages");
const contenuRoutes = require("./routes/contenu");
const rappelsRoutes = require("./routes/rappels");
const quizRoutes = require("./routes/quiz");
const tdRoutes = require("./routes/td");
const adminContenuRoutes = require("./routes/admin-contenu");
const abonnementRoutes = require("./routes/abonnements");
const {
  mettreAJourAbonnementsExpires,
} = require("./services/abonnements");

// Sans clé secrète, express-session ne peut pas signer le cookie. On s'arrête
// immédiatement plutôt que de mettre une valeur prévisible dans le code.
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
  console.error(
    "Erreur : copiez .env.example vers .env et remplacez SESSION_SECRET par une chaîne d'au moins 16 caractères."
  );
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT) || 3000;
const production = process.env.NODE_ENV === "production";
const cookieSecure = process.env.COOKIE_SECURE === "false" ? false : production;

// Les en-têtes de helmet activent plusieurs protections du navigateur (anti-
// clickjacking, refus de deviner le type d'un fichier, etc.).
app.use(helmet());

// Si le site passe par un reverse-proxy HTTPS, Express doit faire confiance à
// ce premier proxy pour savoir que la requête venait bien de HTTPS.
if (production) {
  app.set("trust proxy", 1);
}

// On accepte seulement de petits corps JSON : un formulaire de connexion n'a
// aucun besoin d'envoyer plusieurs mégaoctets.
app.use(express.json({ limit: "20kb" }));

app.use(
  session({
    name: NOM_COOKIE,
    secret: process.env.SESSION_SECRET,
    store: new MagasinSessionsSQLite(),

    // resave: false évite de réécrire une session inchangée à chaque requête.
    // saveUninitialized: false évite de créer un cookie pour un simple visiteur.
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true, // le JavaScript du navigateur ne peut pas lire le cookie.
      sameSite: "lax", // le cookie n'est pas envoyé depuis un autre site.
      secure: cookieSecure, // HTTPS obligatoire en production, sauf override explicite.
      maxAge: 2 * 60 * 60 * 1000, // 2 heures.
    },
  })
);

// L'API publique et l'API admin reçoivent l'utilisateur courant (s'il y en a).
app.use("/api", chargerUtilisateur, apiRoutes);
app.use("/api", chargerUtilisateur, contenuRoutes);
// Express retire le préfixe de montage avant de passer la requête au routeur.
// Le routeur des rappels déclare "/" : il doit donc être monté sur le chemin
// complet, sinon "/" ne correspondrait jamais à "/api/rappels".
// chargerUtilisateur doit rester ici : il remplit req.utilisateur avant que le
// routeur applique exigerConnexion / exigerStatutValide.
app.use("/api/rappels", chargerUtilisateur, rappelsRoutes);
// Le moteur de quiz et les TD ont leurs propres contrôles d'accès dans le routeur.
app.use("/api/quiz", chargerUtilisateur, quizRoutes);
app.use("/api/td", chargerUtilisateur, tdRoutes);
// Le routeur des abonnements déclare déjà "/mon-abonnement" : on le monte sur
// "/api" pour obtenir "/api/mon-abonnement" une seule fois.
app.use("/api", chargerUtilisateur, abonnementRoutes);
app.use("/api/admin", chargerUtilisateur, adminRoutes);
app.use("/api/admin", chargerUtilisateur, adminContenuRoutes);

// Les pages protégées sont déclarées avant le dossier statique : c'est le
// serveur qui décide si l'accès est autorisé.
app.use(pagesRoutes);

/*
 * Les fichiers JSON d'origine contiennent les bonnes réponses et les corrigés.
 * Express.static les rendrait publics ; on bloque donc ce dossier avant lui.
 * L'import lit ces fichiers sur le disque, il n'a pas besoin de les servir.
 */
app.use("/quiz-contenu/content", function (req, res) {
  return res.status(404).type("text/plain").send("Contenu indisponible.");
});

// Tout le reste du front est servi normalement (HTML, CSS, images).
app.use(
  express.static(path.join(__dirname, "public"), {
    index: "index.html",
  })
);

// Un appel API inconnu reçoit du JSON ; une page inconnue reçoit un 404 simple.
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ erreur: "Route inconnue." });
  }
  return res.status(404).type("text/plain").send("Page introuvable.");
});

// Dernier middleware : il reçoit les erreurs des autres middlewares. On ne
// renvoie jamais la pile d'appel (stack) au navigateur : elle peut contenir des
// chemins de fichiers ou des détails de la base.
app.use((erreur, req, res, suite) => {
  console.error("Erreur serveur :", erreur.message);
  if (res.headersSent) {
    return suite(erreur);
  }
  return res.status(500).json({ erreur: "Erreur interne du serveur." });
});

// Un abonnement expire automatiquement à sa date de fin : au démarrage puis
// toutes les heures. Les routes qui lisent un abonnement refont aussi le check,
// au cas où cette tâche n'aurait pas tourné (serveur éteint la veille par ex.).
try {
  mettreAJourAbonnementsExpires();
} catch (erreur) {
  console.error("Expiration des abonnements impossible :", erreur.message);
}
const minuteurExpiration = setInterval(() => {
  try {
    mettreAJourAbonnementsExpires();
  } catch (erreur) {
    console.error("Expiration des abonnements impossible :", erreur.message);
  }
}, 60 * 60 * 1000);
// unref() : cette tâche ne doit pas empêcher le processus de s'arrêter.
minuteurExpiration.unref();

// base est chargée au démarrage : cela crée les tables avant la première requête.
void base;

// On exporte l'application pour que les tests puissent la démarrer sur un port
// temporaire sans ouvrir le serveur "réel" (voir tests/api.test.js).
module.exports = app;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Serveur IDA P13 démarré sur http://localhost:${port}`);
    console.log(
      `Base de données : ${process.env.DB_PATH || "./donnees/revision-p13.db"}`
    );
  });
}
