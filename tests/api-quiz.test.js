/*
 * tests/api-quiz.test.js
 * Tests d'intégration des routes quiz, TD et administration des contenus.
 *
 * On démarre le vrai serveur sur un port libre et on l'appelle avec fetch(),
 * comme le navigateur. La base est temporaire, donc les tests ne touchent pas
 * aux comptes ni aux contenus du site.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const bcrypt = require("bcrypt");
const { once } = require("node:events");

const dossierTemporaire = fs.mkdtempSync(path.join(os.tmpdir(), "p13-api-quiz-"));
process.env.DB_PATH = path.join(dossierTemporaire, "api-quiz.db");
process.env.SESSION_SECRET = "cle-de-test-api-quiz-123456789";

const base = require("../db/connexion");
const { initialiserContenu } = require("../scripts/init-contenu");
const { importerContenu } = require("../scripts/importer-contenu");
const app = require("../server");

const MOT_DE_PASSE = "motdepasse123";
let serveur;
let url;
let cookieEtudiant;
let cookieSansAbo;
let cookieAdmin;
let moduleIntroduction;
let moduleTroisieme;

function moduleParSlugs(matiereSlug, moduleSlug) {
  return base
    .prepare(
      `SELECT m.*, mat.slug AS matiere_slug FROM modules m
       JOIN matieres mat ON mat.id = m.matiere_id
       WHERE mat.slug = ? AND m.slug = ?`
    )
    .get(matiereSlug, moduleSlug);
}

async function connecter(whatsapp) {
  const reponse = await fetch(`${url}/api/connexion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ whatsapp, mot_de_passe: MOT_DE_PASSE }),
  });
  assert.equal(reponse.status, 200, "connexion de test impossible");
  return reponse.headers.getSetCookie()[0].split(";")[0];
}

async function api(chemin, options = {}) {
  const enTetes = { Accept: "application/json" };
  if (options.cookie) {
    enTetes.Cookie = options.cookie;
  }
  if (options.corps) {
    enTetes["Content-Type"] = "application/json";
  }
  const reponse = await fetch(`${url}${chemin}`, {
    method: options.method || "GET",
    headers: enTetes,
    body: options.corps ? JSON.stringify(options.corps) : undefined,
  });
  const donnees = await reponse.json().catch(() => ({}));
  return { reponse, donnees };
}

// Calcule les positions à envoyer en lisant l'ordre mélangé stocké côté serveur.
function reponsesCorrectes(tentativeId) {
  const tentative = base
    .prepare("SELECT questions_json FROM tentatives_quiz WHERE id = ?")
    .get(tentativeId);
  const ordre = JSON.parse(tentative.questions_json);
  const questions = base.prepare("SELECT * FROM questions_quiz").all();
  const parRef = new Map(questions.map((question) => [question.question_ref, question]));

  return ordre.map(function (element) {
    const question = parRef.get(element.questionRef);
    return {
      questionRef: element.questionRef,
      index: element.ordreOptions.indexOf(question.reponse_index),
    };
  });
}

test.before(async function () {
  initialiserContenu(base);
  importerContenu(base);

  moduleIntroduction = moduleParSlugs("algorithmique", "introduction");
  moduleTroisieme = moduleParSlugs("algorithmique", "sous-programmes");

  // On publie seulement ce qui sert aux tests : tout le reste reste brouillon.
  base
    .prepare(
      "UPDATE contenus SET statut = 'publie' WHERE module_id = ? AND type IN ('quiz', 'td')"
    )
    .run(moduleIntroduction.id);

  const hache = bcrypt.hashSync(MOT_DE_PASSE, 4);
  const inserer = base.prepare(
    `INSERT INTO users (pseudo, whatsapp, mot_de_passe_hache, statut, role)
     VALUES (?, ?, ?, 'valide', ?)`
  );
  inserer.run("EtudiantApi", "+221770000101", hache, "etudiant");
  inserer.run("SansAboApi", "+221770000102", hache, "etudiant");
  inserer.run("AdminApi", "+221770000103", hache, "admin");

  const offre1000 = base.prepare("SELECT id FROM offres WHERE prix_fcfa = 1000").get();
  const utilisateur = base
    .prepare("SELECT id FROM users WHERE whatsapp = ?")
    .get("+221770000101");
  base
    .prepare(
      `INSERT INTO abonnements (utilisateur_id, offre_id, date_debut, date_fin, statut)
       VALUES (?, ?, '2026-01-01', '2030-01-01', 'actif')`
    )
    .run(utilisateur.id, offre1000.id);

  serveur = app.listen(0);
  await once(serveur, "listening");
  url = `http://127.0.0.1:${serveur.address().port}`;

  cookieEtudiant = await connecter("+221770000101");
  cookieSansAbo = await connecter("+221770000102");
  cookieAdmin = await connecter("+221770000103");
});

test.after(async function () {
  if (serveur) {
    await new Promise((resoudre) => serveur.close(resoudre));
  }
  base.close();
  fs.rmSync(dossierTemporaire, { recursive: true, force: true });
});

test("les fichiers sources contenant les corrigés ne sont pas servis", async function () {
  const reponse = await fetch(
    `${url}/quiz-contenu/content/algorithme/introduction.quiz.json`
  );
  assert.equal(reponse.status, 404);
  const texte = await reponse.text();
  assert.equal(texte.includes('"reponse"'), false);
});

test("l'accès par offre passe avant la progression", async function () {
  const { reponse, donnees } = await api(
    "/api/quiz/algorithmique/structures-controle",
    { cookie: cookieSansAbo }
  );
  assert.equal(reponse.status, 403);
  assert.match(donnees.erreur, /abonnement/);
  assert.ok(Array.isArray(donnees.offres) && donnees.offres.length > 0);
});

test("un quiz non publié n'est pas accessible", async function () {
  const { reponse, donnees } = await api(
    "/api/quiz/html-css/introduction-html-css",
    { cookie: cookieEtudiant }
  );
  assert.equal(reponse.status, 403);
  assert.match(donnees.erreur, /pas encore publié/);
});

test("le quiz démarre sans révéler les réponses puis se corrige", async function () {
  const demarrage = await api("/api/quiz/algorithmique/introduction", {
    cookie: cookieEtudiant,
  });
  assert.equal(demarrage.reponse.status, 200);
  assert.equal(demarrage.donnees.questions.length, 20);
  const brut = JSON.stringify(demarrage.donnees);
  assert.equal(brut.includes('"explication"'), false);
  assert.equal(brut.includes('"bonneReponse"'), false);

  const tentativeId = demarrage.donnees.tentative.id;
  const correction = await api(`/api/quiz/${tentativeId}/reponses`, {
    method: "POST",
    cookie: cookieEtudiant,
    corps: { reponses: reponsesCorrectes(tentativeId) },
  });
  assert.equal(correction.reponse.status, 200);
  assert.equal(correction.donnees.score, 20);
  assert.equal(correction.donnees.statut, "reussi");
  assert.equal(correction.donnees.correction.length, 20);
  assert.equal(typeof correction.donnees.correction[0].explication, "string");
});

test("le TD cache sa correction jusqu'au dépôt du travail", async function () {
  const chemin = "/api/td/algorithmique/introduction";

  const avantRendu = await api(`${chemin}/correction`, { cookie: cookieEtudiant });
  assert.equal(avantRendu.reponse.status, 403);
  assert.match(avantRendu.donnees.erreur, /Rendez votre travail/);

  const lecture = await api(chemin, { cookie: cookieEtudiant });
  assert.equal(lecture.reponse.status, 200);
  assert.ok(lecture.donnees.exercices.length > 0);
  const brut = JSON.stringify(lecture.donnees);
  assert.equal(brut.includes('"solution"'), false);
  assert.equal(brut.includes('"explication"'), false);
  assert.equal(brut.includes('"reponse"'), false);

  const reference = lecture.donnees.exercices[0].ref;
  const rendu = await api(`${chemin}/rendu`, {
    method: "POST",
    cookie: cookieEtudiant,
    corps: { exerciceRef: reference, contenu: "Ma réponse de test." },
  });
  assert.equal(rendu.reponse.status, 201);

  const apresRendu = await api(`${chemin}/correction`, { cookie: cookieEtudiant });
  assert.equal(apresRendu.reponse.status, 200);
  assert.ok(apresRendu.donnees.exercices.length > 0);
  assert.equal(typeof apresRendu.donnees.exercices[0].solution, "string");
});

test("/api/modules-etats garde 'etat' et ajoute la progression", async function () {
  const { reponse, donnees } = await api("/api/modules-etats", {
    cookie: cookieEtudiant,
  });
  assert.equal(reponse.status, 200);

  const parCle = new Map(
    donnees.modules.map((module) => [`${module.matiereSlug}|${module.moduleSlug}`, module])
  );
  const introduction = parCle.get("algorithmique|introduction");
  const troisieme = parCle.get(`algorithmique|${moduleTroisieme.slug}`);

  assert.equal(introduction.etat, "disponible");
  assert.equal(introduction.debloque, true);
  assert.equal(troisieme.etat, "disponible");
  assert.equal(troisieme.debloque, false);
});

test("l'admin publie un contenu complet et refuse un contenu vide", async function () {
  const moduleComplet = moduleParSlugs("html-css", "introduction-html-css");
  const publication = await api(
    `/api/admin/contenus/quiz/${moduleComplet.id}/publier`,
    { method: "POST", cookie: cookieAdmin, corps: {} }
  );
  assert.equal(publication.reponse.status, 200);

  const moduleVide = moduleParSlugs("intro-web", "reseau-internet");
  const refus = await api(
    `/api/admin/contenus/td/${moduleVide.id}/publier`,
    { method: "POST", cookie: cookieAdmin, corps: {} }
  );
  assert.equal(refus.reponse.status, 400);
  assert.match(refus.donnees.erreur, /incomplet/);

  const etudiant = await api("/api/quiz/html-css/introduction-html-css", {
    cookie: cookieEtudiant,
  });
  assert.equal(etudiant.reponse.status, 200);
});

test("un étudiant ne peut pas utiliser les routes d'administration", async function () {
  const { reponse } = await api("/api/admin/contenus", { cookie: cookieEtudiant });
  assert.equal(reponse.status, 403);
});
