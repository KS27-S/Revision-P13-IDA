/*
 * tests/base.test.js
 * Vérifie la structure de la base et les deux scripts de remplissage.
 *
 * Chaque fichier de test utilise une base temporaire : on ne touche jamais à
 * donnees/revision-p13.db, qui contient les vrais comptes des étudiants.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dossierTemporaire = fs.mkdtempSync(path.join(os.tmpdir(), "p13-base-"));
process.env.DB_PATH = path.join(dossierTemporaire, "base.db");

const base = require("../db/connexion");
const { initialiserContenu } = require("../scripts/init-contenu");
const { importerRappels, extraireBlocs } = require("../scripts/importer-rappels");

test.after(() => {
  base.close();
  fs.rmSync(dossierTemporaire, { recursive: true, force: true });
});

test("le schéma crée bien les cinq nouvelles tables", () => {
  const tables = base
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((ligne) => ligne.name);

  for (const nom of ["matieres", "modules", "rappels", "offres", "abonnements"]) {
    assert.ok(tables.includes(nom), `table ${nom} absente`);
  }
});

test("init-contenu lit les 8 matières et les 37 modules de revision.html", () => {
  const resultat = initialiserContenu(base);

  assert.equal(resultat.matieres, 8);
  assert.equal(resultat.modules, 37);
  assert.equal(resultat.offres, 3);
  assert.equal(resultat.offerts, 8);

  // Le premier module de chaque matière est offert, les autres ne le sont pas.
  const offerts = base
    .prepare("SELECT matiere_id, COUNT(*) AS total FROM modules WHERE offert = 1 GROUP BY matiere_id")
    .all();
  assert.equal(offerts.length, 8);
  assert.ok(offerts.every((ligne) => ligne.total === 1));

  // Les noms et prix sont exactement ceux du cahier des charges.
  const offres = base.prepare("SELECT nom, prix_fcfa FROM offres ORDER BY prix_fcfa").all();
  assert.deepEqual(
    offres.map((offre) => `${offre.nom} / ${offre.prix_fcfa}`),
    ["500 F par mois / 500", "1 000 F par mois / 1000", "2 000 F par mois / 2000"]
  );
});

test("relancer init-contenu ne crée aucun doublon", () => {
  initialiserContenu(base);
  initialiserContenu(base);
  assert.equal(base.prepare("SELECT COUNT(*) AS n FROM matieres").get().n, 8);
  assert.equal(base.prepare("SELECT COUNT(*) AS n FROM modules").get().n, 37);
  assert.equal(base.prepare("SELECT COUNT(*) AS n FROM offres").get().n, 3);
});

test("l'import des rappels conserve le texte HTML à l'identique", () => {
  // petit fichier de test qui reproduit exactement la structure de l'ancien HTML
  const contenuOffert = "            <h3>Objectifs</h3>\n            <p>Contenu &lt;test&gt;</p>\n";
  const contenuPayant = "            <h3>À retenir</h3>\n            <p>Un tableau :</p>\n";
  const html = `      <div class="rappel">
        <h4>Algorithme</h4>
        <details id="rappel-algorithme">
          <summary>Algorithme — Introduction à l'algorithmique</summary>
          <div class="rappel">
${contenuOffert}          </div>
        </details>
      </div>
      <div class="rappel">
        <h4>JavaScript</h4>
        <details id="rappel-javascript">
          <summary>JavaScript — Le langage JavaScript</summary>
          <div class="rappel">
${contenuPayant}          </div>
        </details>
      </div>
`;
  const chemin = path.join(dossierTemporaire, "rappels-fixture.html");
  fs.writeFileSync(chemin, html, "utf8");

  // On vérifie d'abord que le découpeur a bien trouvé les deux fiches.
  const blocs = extraireBlocs(html);
  assert.equal(blocs.length, 2);
  assert.equal(blocs[0].contenuHtml, contenuOffert);

  const premier = importerRappels(base, chemin);
  assert.equal(premier.importes, 2);
  assert.deepEqual(premier.erreurs, []);

  const lignes = base
    .prepare("SELECT r.contenu_html, m.slug FROM rappels r JOIN modules m ON m.id = r.module_id ORDER BY r.id")
    .all();
  assert.equal(lignes.length, 2);
  const parSlug = new Map(lignes.map((ligne) => [ligne.slug, ligne.contenu_html]));
  assert.equal(parSlug.get("introduction"), contenuOffert);
  assert.equal(parSlug.get("langage-javascript"), contenuPayant);

  // Relancer l'import ne doit ni dupliquer ni écraser.
  const second = importerRappels(base, chemin);
  assert.equal(second.importes, 0);
  assert.equal(second.ignores, 2);
  assert.equal(base.prepare("SELECT COUNT(*) AS n FROM rappels").get().n, 2);
});
