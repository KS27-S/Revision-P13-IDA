/*
 * tests/regles-quiz.test.js
 * Tests des règles du quiz, directement sur les services (sans serveur HTTP).
 *
 * Le but est de prouver les points les plus faciles à casser plus tard :
 * absence de réponses avant correction, 3 tentatives, 12 h, 2 tentatives,
 * meilleur score, et déblocage du module suivant.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dossierTemporaire = fs.mkdtempSync(path.join(os.tmpdir(), "p13-quiz-"));
process.env.DB_PATH = path.join(dossierTemporaire, "quiz.db");
process.env.SESSION_SECRET = "cle-de-test-quiz-123456789";

const base = require("../db/connexion");
const { initialiserContenu } = require("../scripts/init-contenu");
const {
  demarrerTentative,
  corrigerTentative,
  etatTentatives,
  DELAI_REPRISE_MS,
} = require("../services/tentatives");
const {
  verifierProgression,
} = require("../services/progression");

const T0 = new Date("2026-01-01T08:00:00Z").getTime();
let utilisateurId;
let quizParModule;

function moduleParSlugs(matiereSlug, moduleSlug) {
  return base
    .prepare(
      `SELECT m.* FROM modules m JOIN matieres mat ON mat.id = m.matiere_id
       WHERE mat.slug = ? AND m.slug = ?`
    )
    .get(matiereSlug, moduleSlug);
}

function insererQuiz(moduleId, prefixe) {
  const resultat = base
    .prepare(
      "INSERT INTO quiz (module_id, titre, sources_json, source_hash) VALUES (?, ?, '[]', ?)"
    )
    .run(moduleId, `Quiz ${prefixe}`, `${prefixe}-hash`);
  const quizId = Number(resultat.lastInsertRowid);
  const niveaux = [
    ...Array(7).fill("facile"),
    ...Array(7).fill("moyen"),
    ...Array(6).fill("difficile"),
  ];
  const inserer = base.prepare(
    `INSERT INTO questions_quiz
      (quiz_id, question_ref, niveau, enonce, choix_json, reponse_index,
       explication, ordre_original)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  niveaux.forEach(function (niveau, index) {
    inserer.run(
      quizId,
      `${prefixe}-q-${index + 1}`,
      niveau,
      `Question ${index + 1}`,
      JSON.stringify([`A${index}`, `B${index}`, `C${index}`, `D${index}`]),
      index % 4,
      `Explication ${index + 1}`,
      index
    );
  });
  return quizId;
}

// Reconstruit des réponses avec le nombre voulu de bonnes réponses. Les
// positions sont calculées à partir de l'ordre mélangé stocké par le serveur.
function reponsesAvecScore(tentativeId, scoreVoulu) {
  const tentative = base
    .prepare("SELECT * FROM tentatives_quiz WHERE id = ?")
    .get(tentativeId);
  const ordre = JSON.parse(tentative.questions_json);
  const questions = base.prepare("SELECT * FROM questions_quiz").all();
  const parRef = new Map(questions.map((question) => [question.question_ref, question]));

  return ordre.map((element, index) => {
    const question = parRef.get(element.questionRef);
    const bonnePosition = element.ordreOptions.indexOf(question.reponse_index);
    const position = index < scoreVoulu ? bonnePosition : (bonnePosition + 1) % 4;
    return { questionRef: element.questionRef, index: position };
  });
}

function nouvelleTentative(moduleSlug, maintenant) {
  const module = moduleParSlugs("algorithmique", moduleSlug);
  return demarrerTentative(base, utilisateurId, module.id, quizParModule.get(module.id), maintenant);
}

function reinitialiserTentatives() {
  base.prepare("DELETE FROM tentatives_quiz").run();
}

test.before(function () {
  initialiserContenu(base);
  const resultat = base
    .prepare(
      `INSERT INTO users (pseudo, whatsapp, mot_de_passe_hache, statut, role)
       VALUES ('QuizTest', '+221770000099', 'hache', 'valide', 'etudiant')`
    )
    .run();
  utilisateurId = Number(resultat.lastInsertRowid);

  quizParModule = new Map();
  ["introduction", "structures-controle", "sous-programmes"].forEach(function (slug) {
    const module = moduleParSlugs("algorithmique", slug);
    quizParModule.set(module.id, insererQuiz(module.id, slug));
  });
});

test.after(function () {
  base.close();
  fs.rmSync(dossierTemporaire, { recursive: true, force: true });
});

test("le démarrage n'envoie jamais réponse ni explication", function () {
  reinitialiserTentatives();
  const demarrage = nouvelleTentative("structures-controle", T0);

  assert.equal(demarrage.questions.length, 20);
  assert.equal(demarrage.tentative.numeroTentative, 1);
  assert.equal(demarrage.tentative.tentativesRestantes, 2);

  demarrage.questions.forEach(function (question) {
    assert.equal(Object.hasOwn(question, "reponse"), false);
    assert.equal(Object.hasOwn(question, "reponse_index"), false);
    assert.equal(Object.hasOwn(question, "explication"), false);
    assert.equal(question.choix.length, 4);
    assert.deepEqual(
      question.choix.map((choix) => choix.position),
      [0, 1, 2, 3]
    );
  });

  const brute = JSON.stringify(
    base.prepare("SELECT questions_json FROM tentatives_quiz").get()
  );
  assert.equal(brute.includes("reponse_index"), false);
});

test("la correction donne le score, le statut et les explications", function () {
  reinitialiserTentatives();
  const demarrage = nouvelleTentative("structures-controle", T0);
  const resultat = corrigerTentative(
    base,
    utilisateurId,
    demarrage.tentative.id,
    reponsesAvecScore(demarrage.tentative.id, 16),
    T0 + 1000
  );

  assert.equal(resultat.score, 16);
  assert.equal(resultat.statut, "reussi");
  assert.equal(resultat.valideModule, true);
  assert.equal(resultat.correction.length, 20);
  assert.equal(typeof resultat.correction[0].explication, "string");
  assert.equal(typeof resultat.correction[0].bonneReponseTexte, "string");

  const enregistre = base
    .prepare("SELECT score, reussi, valide_module FROM tentatives_quiz WHERE id = ?")
    .get(demarrage.tentative.id);
  assert.equal(enregistre.score, 16);
  assert.equal(enregistre.reussi, 1);
  assert.equal(enregistre.valide_module, 1);
});

test("3 tentatives, 12 h d'attente, puis 2 tentatives", function () {
  reinitialiserTentatives();
  const module = moduleParSlugs("algorithmique", "structures-controle");
  const quizId = quizParModule.get(module.id);

  for (let numero = 1; numero <= 3; numero += 1) {
    const demarrage = demarrerTentative(base, utilisateurId, module.id, quizId, T0);
    assert.equal(demarrage.tentative.cycle, 1);
    const resultat = corrigerTentative(
      base,
      utilisateurId,
      demarrage.tentative.id,
      reponsesAvecScore(demarrage.tentative.id, 0),
      T0
    );
    assert.equal(resultat.score, 0);
    assert.equal(resultat.statut, "non_valide");
  }

  const etatBloque = etatTentatives(base, utilisateurId, module.id, T0);
  assert.equal(etatBloque.attenteMs, DELAI_REPRISE_MS);
  assert.equal(etatBloque.restantes, 0);

  const refuse = demarrerTentative(base, utilisateurId, module.id, quizId, T0);
  assert.equal(refuse.refuse, true);

  const apresAttente = T0 + DELAI_REPRISE_MS;
  const reprise = demarrerTentative(base, utilisateurId, module.id, quizId, apresAttente);
  assert.equal(reprise.refuse, undefined);
  assert.equal(reprise.tentative.cycle, 2);
  assert.equal(reprise.tentative.numeroTentative, 4);
  assert.equal(reprise.tentative.tentativesRestantes, 1);
  corrigerTentative(
    base,
    utilisateurId,
    reprise.tentative.id,
    reponsesAvecScore(reprise.tentative.id, 0),
    apresAttente
  );

  const deuxieme = demarrerTentative(base, utilisateurId, module.id, quizId, apresAttente);
  assert.equal(deuxieme.tentative.cycle, 2);
  assert.equal(deuxieme.tentative.numeroTentative, 5);
  assert.equal(deuxieme.tentative.tentativesRestantes, 0);
  corrigerTentative(
    base,
    utilisateurId,
    deuxieme.tentative.id,
    reponsesAvecScore(deuxieme.tentative.id, 0),
    apresAttente
  );

  const nouvelleAttente = etatTentatives(
    base,
    utilisateurId,
    module.id,
    apresAttente
  );
  assert.equal(nouvelleAttente.attenteMs, DELAI_REPRISE_MS);
  assert.equal(nouvelleAttente.cycle, 3);
});

test("le meilleur score sert au seuil de validation à 10/20", function () {
  reinitialiserTentatives();
  const module = moduleParSlugs("algorithmique", "structures-controle");
  const quizId = quizParModule.get(module.id);

  const premier = demarrerTentative(base, utilisateurId, module.id, quizId, T0);
  const resultatNeuf = corrigerTentative(
    base,
    utilisateurId,
    premier.tentative.id,
    reponsesAvecScore(premier.tentative.id, 9),
    T0
  );
  assert.equal(resultatNeuf.valideModule, false);

  const deuxieme = demarrerTentative(base, utilisateurId, module.id, quizId, T0 + 1000);
  const resultatDix = corrigerTentative(
    base,
    utilisateurId,
    deuxieme.tentative.id,
    reponsesAvecScore(deuxieme.tentative.id, 10),
    T0 + 2000
  );
  assert.equal(resultatDix.statut, "a_revoir");
  assert.equal(resultatDix.valideModule, true);
  assert.equal(resultatDix.meilleurScore, 10);

  // Une troisième tentative mauvaise n'annule pas la validation.
  const troisieme = demarrerTentative(base, utilisateurId, module.id, quizId, T0 + 3000);
  const resultatTrois = corrigerTentative(
    base,
    utilisateurId,
    troisieme.tentative.id,
    reponsesAvecScore(troisieme.tentative.id, 2),
    T0 + 4000
  );
  assert.equal(resultatTrois.meilleurScore, 10);
  assert.equal(resultatTrois.statut, "a_revoir");
});

test("un module ne se débloque qu'après la validation du quiz précédent", function () {
  reinitialiserTentatives();
  const premier = moduleParSlugs("algorithmique", "introduction");
  const deuxieme = moduleParSlugs("algorithmique", "structures-controle");
  const troisieme = moduleParSlugs("algorithmique", "sous-programmes");

  assert.equal(verifierProgression(base, { id: utilisateurId }, premier).autorise, true);
  assert.equal(verifierProgression(base, { id: utilisateurId }, deuxieme).autorise, false);

  const demarrage = demarrerTentative(
    base,
    utilisateurId,
    premier.id,
    quizParModule.get(premier.id),
    T0
  );
  corrigerTentative(
    base,
    utilisateurId,
    demarrage.tentative.id,
    reponsesAvecScore(demarrage.tentative.id, 10),
    T0
  );

  assert.equal(verifierProgression(base, { id: utilisateurId }, deuxieme).autorise, true);
  assert.equal(verifierProgression(base, { id: utilisateurId }, troisieme).autorise, false);
});
