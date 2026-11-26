/*
 * tests/api.test.js
 * Tests d'intégration : on démarre la vraie application Express sur un port
 * temporaire et on l'appelle avec fetch(), comme le ferait le navigateur.
 *
 * On vérifie surtout la règle de sécurité demandée : quand l'accès est refusé,
 * la réponse ne contient jamais le texte du rappel.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const bcrypt = require("bcrypt");
const { once } = require("node:events");

const dossierTemporaire = fs.mkdtempSync(path.join(os.tmpdir(), "p13-api-"));
process.env.DB_PATH = path.join(dossierTemporaire, "api.db");
process.env.SESSION_SECRET = "cle-de-test-pour-les-api-123456789";

const base = require("../db/connexion");
const { initialiserContenu } = require("../scripts/init-contenu");
const { importerRappels } = require("../scripts/importer-rappels");
const { MESSAGE_ATTENTE } = require("../middleware/authentification");
const app = require("../server");

const MOT_DE_PASSE = "motdepasse123";
let serveur;
let url;
let etudiantCookie;
let adminCookie;
let sansAboCookie;
let attenteCookie;
let refuseCookie;
let rappelOffertId;
let rappelPayantId;

test.before(async () => {
  initialiserContenu(base);

  // Deux fiches seulement : une offerte, une payante.
  const offert = base.prepare("SELECT * FROM modules WHERE slug = 'introduction'").get();
  const payant = base
    .prepare("SELECT * FROM modules WHERE slug = 'structures-controle'")
    .get();
  const html = `      <div class="rappel">
        <h4>Test</h4>
        <details id="rappel-a">
          <summary>Test — ${offert.titre}</summary>
          <div class="rappel">
            <h3>Objectifs</h3>
            <p>Cours offert &lt;texte&gt;</p>
          </div>
        </details>
      </div>
      <div class="rappel">
        <h4>Test</h4>
        <details id="rappel-b">
          <summary>Test — ${payant.titre}</summary>
          <div class="rappel">
            <h3>Objectifs</h3>
            <p>Cours payant &lt;secret&gt;</p>
          </div>
        </details>
      </div>
`;
  const chemin = path.join(dossierTemporaire, "fixture.html");
  fs.writeFileSync(chemin, html, "utf8");
  const importation = importerRappels(base, chemin);
  assert.equal(importation.importes, 2);
  assert.deepEqual(importation.erreurs, []);

  rappelOffertId = base
    .prepare("SELECT id FROM rappels WHERE module_id = ?")
    .get(offert.id).id;
  rappelPayantId = base
    .prepare("SELECT id FROM rappels WHERE module_id = ?")
    .get(payant.id).id;

  // Comptes de test, créés directement en base pour aller vite.
  const hache = bcrypt.hashSync(MOT_DE_PASSE, 4);
  const inserer = base.prepare(
    `INSERT INTO users (pseudo, whatsapp, mot_de_passe_hache, statut, role)
     VALUES (?, ?, ?, 'valide', ?)`
  );
  inserer.run("EleveTest", "+221770000001", hache, "etudiant");
  inserer.run("AdminTest", "+221770000002", hache, "admin");
  inserer.run("SansAboTest", "+221770000003", hache, "etudiant");
  inserer.run("AttenteTest", "+221770000004", hache, "etudiant");
  inserer.run("RefuseTest", "+221770000005", hache, "etudiant");

  serveur = app.listen(0);
  await once(serveur, "listening");
  url = `http://127.0.0.1:${serveur.address().port}`;

  etudiantCookie = await connecter("+221770000001");
  adminCookie = await connecter("+221770000002");
  sansAboCookie = await connecter("+221770000003");
  attenteCookie = await connecter("+221770000004");
  refuseCookie = await connecter("+221770000005");

  // La connexion refuse un compte non validé. On crée donc d'abord une session
  // valide, puis on change le statut en base : chargerUtilisateur relit la base
  // à chaque requête, ce qui simule un compte passé en attente ou refusé.
  base
    .prepare("UPDATE users SET statut = 'en_attente' WHERE whatsapp = ?")
    .run("+221770000004");
  base
    .prepare("UPDATE users SET statut = 'refuse' WHERE whatsapp = ?")
    .run("+221770000005");
});

test.after(async () => {
  if (serveur) {
    await new Promise((resoudre) => serveur.close(resoudre));
  }
  base.close();
  fs.rmSync(dossierTemporaire, { recursive: true, force: true });
});

async function connecter(whatsapp) {
  const reponse = await fetch(`${url}/api/connexion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ whatsapp, mot_de_passe: MOT_DE_PASSE }),
  });
  assert.equal(reponse.status, 200, "connexion de test impossible");
  const cookies = reponse.headers.getSetCookie();
  return cookies[0].split(";")[0];
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

test("l'API fonctionne de bout en bout", async (t) => {
  // Vérifie un refus "auth" : message court, aucun cours, aucune offre, aucun
  // drapeau accessible. Les offres ne sont proposées qu'aux comptes validés.
  async function verifierRefusAuth(chemin, cookie, statut, message) {
    const { reponse, donnees } = await api(chemin, cookie ? { cookie } : {});
    assert.equal(reponse.status, statut);
    assert.equal(donnees.erreur, message);
    assert.equal(donnees.contenuHtml, undefined);
    assert.equal(Object.hasOwn(donnees, "accessible"), false);
    assert.equal(Object.hasOwn(donnees, "offres"), false);
    const brut = JSON.stringify(donnees);
    assert.equal(brut.includes("Cours offert"), false);
    assert.equal(brut.includes("Cours payant"), false);
  }

  await t.test("les offres viennent du cahier des charges", async () => {
    const { reponse, donnees } = await api("/api/offres");
    assert.equal(reponse.status, 200);
    assert.deepEqual(
      donnees.offres.map((offre) => `${offre.nom}:${offre.prix_fcfa}`),
      [
        "500 F par mois:500",
        "1 000 F par mois:1000",
        "2 000 F par mois:2000",
      ]
    );
  });

  await t.test("la liste anonyme est refusée sans rien révéler", async () => {
    await verifierRefusAuth(
      "/api/rappels",
      null,
      401,
      "Connectez-vous pour accéder à cette page."
    );
  });

  await t.test("la liste d'un étudiant validé ne contient que des métadonnées", async () => {
    const { reponse, donnees } = await api("/api/rappels", {
      cookie: sansAboCookie,
    });
    assert.equal(reponse.status, 200);
    assert.equal(donnees.rappels.length, 2);
    assert.equal(donnees.rappels[0].accessible, true);
    assert.equal(donnees.rappels[1].accessible, false);
    assert.equal(Object.hasOwn(donnees.rappels[0], "contenuHtml"), false);
    assert.equal(Object.hasOwn(donnees.rappels[1], "contenuHtml"), false);
    const brut = JSON.stringify(donnees);
    assert.equal(brut.includes("Cours offert"), false);
    assert.equal(brut.includes("Cours payant"), false);
    assert.deepEqual(
      donnees.offres.map((offre) => offre.prix_fcfa),
      [1000, 2000]
    );
  });

  await t.test("la liste de l'admin ne contient pas plus de cours", async () => {
    const { reponse, donnees } = await api("/api/rappels", {
      cookie: adminCookie,
    });
    assert.equal(reponse.status, 200);
    assert.equal(Object.hasOwn(donnees.rappels[0], "contenuHtml"), false);
    assert.equal(Object.hasOwn(donnees.rappels[1], "contenuHtml"), false);
    const brut = JSON.stringify(donnees);
    assert.equal(brut.includes("Cours offert"), false);
    assert.equal(brut.includes("Cours payant"), false);
  });

  await t.test("visiteur anonyme : offert et payant refusés", async () => {
    for (const id of [rappelOffertId, rappelPayantId]) {
      await verifierRefusAuth(
        `/api/rappels/${id}`,
        null,
        401,
        "Connectez-vous pour accéder à cette page."
      );
    }
  });

  await t.test("compte en attente : offert et payant refusés", async () => {
    for (const id of [rappelOffertId, rappelPayantId]) {
      await verifierRefusAuth(
        `/api/rappels/${id}`,
        attenteCookie,
        403,
        MESSAGE_ATTENTE
      );
    }
  });

  await t.test("compte refusé : offert et payant refusés", async () => {
    for (const id of [rappelOffertId, rappelPayantId]) {
      await verifierRefusAuth(
        `/api/rappels/${id}`,
        refuseCookie,
        403,
        "Accès refusé."
      );
    }
  });

  await t.test("étudiant validé sans abonnement : offert oui, payant non", async () => {
    const libre = await api(`/api/rappels/${rappelOffertId}`, {
      cookie: sansAboCookie,
    });
    assert.equal(libre.reponse.status, 200);
    assert.match(libre.donnees.contenuHtml, /Cours offert/);

    const bloque = await api(`/api/rappels/${rappelPayantId}`, {
      cookie: sansAboCookie,
    });
    assert.equal(bloque.reponse.status, 403);
    assert.equal(bloque.donnees.contenuHtml, undefined);
    assert.ok(bloque.donnees.offres.length > 0);
  });

  await t.test("admin validé sans abonnement : mêmes règles qu'un étudiant", async () => {
    const libre = await api(`/api/rappels/${rappelOffertId}`, {
      cookie: adminCookie,
    });
    assert.equal(libre.reponse.status, 200);
    assert.match(libre.donnees.contenuHtml, /Cours offert/);

    const bloque = await api(`/api/rappels/${rappelPayantId}`, {
      cookie: adminCookie,
    });
    assert.equal(bloque.reponse.status, 403);
    assert.equal(bloque.donnees.contenuHtml, undefined);
    assert.equal(JSON.stringify(bloque.donnees).includes("Cours payant"), false);
  });

  await t.test("revision.html reçoit les états depuis /api/modules-etats", async () => {
    const { donnees } = await api("/api/modules-etats", { cookie: etudiantCookie });
    const parSlug = new Map(donnees.modules.map((m) => [m.moduleSlug, m.etat]));
    assert.equal(parSlug.get("introduction"), "disponible");
    assert.equal(parSlug.get("structures-controle"), "verrouille");
  });

  await t.test("les routes admin sont protégées", async () => {
    assert.equal((await api("/api/admin/abonnements")).reponse.status, 401);
    assert.equal(
      (await api("/api/admin/abonnements", { cookie: etudiantCookie })).reponse.status,
      403
    );
    assert.equal(
      (await api("/api/admin/abonnements", { cookie: adminCookie })).reponse.status,
      200
    );
  });

  await t.test("l'admin active un abonnement à 1 000 F", async () => {
    const etudiant = base
      .prepare("SELECT id FROM users WHERE pseudo = 'EleveTest'")
      .get();
    const offre = base.prepare("SELECT id FROM offres WHERE prix_fcfa = 1000").get();

    const activation = await api("/api/admin/abonnements", {
      cookie: adminCookie,
      method: "POST",
      corps: {
        utilisateurId: etudiant.id,
        offreId: offre.id,
        dureeMois: 1,
        referencePaiement: "WAVE-123",
      },
    });
    assert.equal(activation.reponse.status, 201);

    const cours = await api(`/api/rappels/${rappelPayantId}`, {
      cookie: etudiantCookie,
    });
    assert.equal(cours.reponse.status, 200);
    assert.match(cours.donnees.contenuHtml, /Cours payant/);

    const abonnement = await api("/api/mon-abonnement", { cookie: etudiantCookie });
    assert.equal(abonnement.donnees.abonnement.offreNom, "1 000 F par mois");
    // Un mois = 30 jours calendaires ; floor() peut donner 29 selon l'heure.
    assert.ok(
      abonnement.donnees.abonnement.joursRestants >= 28 &&
        abonnement.donnees.abonnement.joursRestants <= 31
    );
    assert.equal(abonnement.donnees.abonnement.referencePaiement, "WAVE-123");

    const etats = await api("/api/modules-etats", { cookie: etudiantCookie });
    const parSlug = new Map(etats.donnees.modules.map((m) => [m.moduleSlug, m.etat]));
    assert.equal(parSlug.get("structures-controle"), "disponible");
  });

  await t.test("un abonnement expiré referme l'accès", async () => {
    const abonnement = base
      .prepare("SELECT id FROM abonnements WHERE statut = 'actif'")
      .get();
    base
      .prepare("UPDATE abonnements SET date_fin = ? WHERE id = ?")
      .run("2020-01-01 00:00:00", abonnement.id);

    const cours = await api(`/api/rappels/${rappelPayantId}`, {
      cookie: etudiantCookie,
    });
    assert.equal(cours.reponse.status, 403);
    assert.equal(cours.donnees.contenuHtml, undefined);

    const vue = await api("/api/mon-abonnement", { cookie: etudiantCookie });
    assert.equal(vue.donnees.abonnement, null);
    assert.equal(vue.donnees.historique[0].statut, "expire");
  });

  await t.test("la prolongation crée une nouvelle ligne et garde l'historique", async () => {
    const etudiant = base
      .prepare("SELECT id FROM users WHERE pseudo = 'EleveTest'")
      .get();
    const offre = base.prepare("SELECT id FROM offres WHERE prix_fcfa = 1000").get();
    const activation = await api("/api/admin/abonnements", {
      cookie: adminCookie,
      method: "POST",
      corps: { utilisateurId: etudiant.id, offreId: offre.id, dureeMois: 1 },
    });
    assert.equal(activation.reponse.status, 201);

    const prolongation = await api(`/api/admin/abonnements/${activation.donnees.id}/prolonger`, {
      cookie: adminCookie,
      method: "POST",
      corps: { dureeMois: 2 },
    });
    assert.equal(prolongation.reponse.status, 201);

    const vue = await api("/api/mon-abonnement", { cookie: etudiantCookie });
    assert.ok(vue.donnees.abonnement.joursRestants > 30);
    assert.equal(vue.donnees.historique.length, 3);
    assert.equal(vue.donnees.historique[1].statut, "remplace");
  });
});
