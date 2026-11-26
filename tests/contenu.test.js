/*
 * tests/contenu.test.js
 * Tests de la chaîne « fichiers sources -> base -> publication ».
 *
 * On utilise une base temporaire : les tests ne doivent jamais écrire dans la
 * vraie base du site, ni modifier les fichiers de cours livrés.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dossierTemporaire = fs.mkdtempSync(path.join(os.tmpdir(), "p13-contenu-"));
process.env.DB_PATH = path.join(dossierTemporaire, "contenu.db");
process.env.SESSION_SECRET = "cle-de-test-contenu-123456789";

const base = require("../db/connexion");
const { initialiserContenu } = require("../scripts/init-contenu");
const { importerContenu } = require("../scripts/importer-contenu");
const {
  validerQuiz,
  validerTD,
  TOTAL_QUESTIONS,
} = require("../services/validation-contenu");
const {
  estComplet,
  publierContenu,
  toutPublier,
} = require("../services/suivi-contenu");

function fabriquerQuiz() {
  const niveaux = [
    ...Array(7).fill("facile"),
    ...Array(7).fill("moyen"),
    ...Array(6).fill("difficile"),
  ];
  return {
    questions: niveaux.map(function (niveau, index) {
      return {
        id: `q-${index + 1}`,
        niveau,
        enonce: `Question ${index + 1} ?`,
        choix: ["A", "B", "C", "D"],
        reponse: index % 4,
        explication: `Explication ${index + 1}`,
      };
    }),
  };
}

function moduleParSlugs(matiereSlug, moduleSlug) {
  return base
    .prepare(
      `SELECT m.* FROM modules m JOIN matieres mat ON mat.id = m.matiere_id
       WHERE mat.slug = ? AND m.slug = ?`
    )
    .get(matiereSlug, moduleSlug);
}

function creerFixtureSource() {
  const racine = path.join(dossierTemporaire, "source-contenu");
  const dossierMatiere = path.join(racine, "dossier-bizarre");
  fs.mkdirSync(dossierMatiere, { recursive: true });

  fs.writeFileSync(
    path.join(racine, "_index.json"),
    JSON.stringify({
      matieres: [{ id: "intro-web", titre: "Introduction au Web", dossier: "faux" }],
    })
  );
  fs.writeFileSync(
    path.join(dossierMatiere, "_matiere.json"),
    JSON.stringify({
      id: "intro-web",
      titre: "Introduction au Web",
      modules: [
        { id: "web-client-serveur", quiz: "quiz.json", td: "td.json" },
      ],
    })
  );
  fs.writeFileSync(path.join(dossierMatiere, "quiz.json"), JSON.stringify(fabriquerQuiz()));
  fs.writeFileSync(
    path.join(dossierMatiere, "td.json"),
    JSON.stringify({
      exercices: [
        {
          id: "fixture-td-1",
          titre: "Exercice de test",
          enonce_simple: "Faire une chose.",
          indices: ["Commencer par là."],
          solution: "Voici la solution.",
          explication_simple: "Parce que.",
          type: "exercice",
        },
      ],
    })
  );
  return racine;
}

test.before(function () {
  initialiserContenu(base);
});

test.after(function () {
  base.close();
  fs.rmSync(dossierTemporaire, { recursive: true, force: true });
});

test("la validation applique exactement les règles du cahier", function () {
  const bon = validerQuiz(fabriquerQuiz());
  assert.equal(bon.complet, true);
  assert.deepEqual(bon.stats.niveaux, { facile: 7, moyen: 7, difficile: 6 });

  const incomplet = fabriquerQuiz();
  incomplet.questions.pop();
  assert.match(
    validerQuiz(incomplet).erreurs.join(" "),
    /20 questions/
  );

  const mauvaiseReponse = fabriquerQuiz();
  mauvaiseReponse.questions[0].reponse = 4;
  assert.equal(validerQuiz(mauvaiseReponse).structureValide, false);

  const sansExplication = fabriquerQuiz();
  delete sansExplication.questions[0].explication;
  assert.equal(validerQuiz(sansExplication).structureValide, false);

  const tdVide = validerTD({ exercices: [] });
  assert.equal(tdVide.estVide, true);
  assert.equal(tdVide.complet, false);

  const ancienFormatQcm = {
    exercices: [{ id: "x", enonce: "?", choix: [], reponse: 0 }],
  };
  assert.equal(validerTD(ancienFormatQcm).structureValide, false);
});

test("l'import charge 37 quiz et 31 TD, sans toucher aux rappels existants", function () {
  const moduleAvecRappel = moduleParSlugs("algorithmique", "introduction");
  base
    .prepare(
      "INSERT INTO rappels (module_id, titre, contenu_html) VALUES (?, ?, ?)"
    )
    .run(moduleAvecRappel.id, "Rappel protégé", "<p>NE PAS TOUCHER</p>");

  const rapport = importerContenu(base);
  assert.equal(rapport.quiz.importes, 37);
  assert.equal(rapport.td.importes, 31);
  assert.equal(rapport.td.vides, 5);
  assert.equal(rapport.td.invalides, 1);
  assert.equal(rapport.rappels.dejaEnBase, 1);
  assert.match(
    rapport.erreurs.map((erreur) => erreur.fichier).join(" "),
    /introduction-mobile\.td\.json/
  );

  const contenuRappel = base
    .prepare("SELECT contenu_html FROM rappels WHERE module_id = ?")
    .get(moduleAvecRappel.id);
  assert.equal(contenuRappel.contenu_html, "<p>NE PAS TOUCHER</p>");

  const statutRappel = base
    .prepare("SELECT statut FROM contenus WHERE module_id = ? AND type = 'rappel'")
    .get(moduleAvecRappel.id);
  assert.equal(statutRappel.statut, "publie");
});

test("relancer l'import ne crée ni doublon ni réécriture inutile", function () {
  const avant = base.prepare("SELECT COUNT(*) AS total FROM questions_quiz").get().total;
  const rapport = importerContenu(base);
  const apres = base.prepare("SELECT COUNT(*) AS total FROM questions_quiz").get().total;

  assert.equal(avant, 740);
  assert.equal(apres, 740);
  assert.equal(rapport.quiz.importes, 0);
  assert.ok(rapport.quiz.inchanges > 0);
});

test("un contenu verrouillé par l'admin n'est pas écrasé par l'import", function () {
  const module = moduleParSlugs("intro-web", "web-client-serveur");
  const titreAvant = base
    .prepare("SELECT titre FROM quiz WHERE module_id = ?")
    .get(module.id).titre;

  base
    .prepare("UPDATE contenus SET verrouille = 1 WHERE module_id = ? AND type = 'quiz'")
    .run(module.id);

  const rapport = importerContenu(base, creerFixtureSource());
  assert.equal(rapport.quiz.verrouilles, 1);

  const titreApres = base
    .prepare("SELECT titre FROM quiz WHERE module_id = ?")
    .get(module.id).titre;
  assert.equal(titreApres, titreAvant);
});

test("la publication refuse les contenus vides ou incomplets", function () {
  const moduleVide = moduleParSlugs("intro-web", "reseau-internet");
  assert.equal(estComplet(base, moduleVide.id, "td"), false);

  const refus = publierContenu(base, "td", moduleVide.id);
  assert.match(refus.erreur, /vide ou incomplet/);

  const statut = base
    .prepare("SELECT statut FROM contenus WHERE module_id = ? AND type = 'td'")
    .get(moduleVide.id);
  assert.notEqual(statut.statut, "publie");

  // On prend un autre module : celui du test précédent a été verrouillé.
  const modulePlein = moduleParSlugs("algorithmique", "structures-controle");
  assert.equal(estComplet(base, modulePlein.id, "quiz"), true);
  assert.equal(publierContenu(base, "quiz", modulePlein.id).ok, true);

  const resultat = toutPublier(base);
  assert.ok(resultat.publies > 0);
  assert.ok(resultat.ignores > 0);

  const videApres = base
    .prepare("SELECT statut FROM contenus WHERE module_id = ? AND type = 'td'")
    .get(moduleVide.id);
  assert.notEqual(videApres.statut, "publie");
});

test("TOTAL_QUESTIONS vaut 20 : la constante est la source des règles", function () {
  assert.equal(TOTAL_QUESTIONS, 20);
});
