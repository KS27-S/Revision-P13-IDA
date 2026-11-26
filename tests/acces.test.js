/*
 * tests/acces.test.js
 * Teste la fonction peutAcceder : c'est elle qui applique les règles du cahier.
 * Aucun serveur HTTP n'est lancé ici, on travaille directement avec la base.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dossierTemporaire = fs.mkdtempSync(path.join(os.tmpdir(), "p13-acces-"));
process.env.DB_PATH = path.join(dossierTemporaire, "acces.db");

const base = require("../db/connexion");
const { initialiserContenu } = require("../scripts/init-contenu");
const { peutAcceder } = require("../services/acces");
const {
  creerAbonnement,
  ajouterMois,
  joursRestants,
  mettreAJourAbonnementsExpires,
} = require("../services/abonnements");

initialiserContenu(base);

test.after(() => {
  base.close();
  fs.rmSync(dossierTemporaire, { recursive: true, force: true });
});

function creerUtilisateur(statut) {
  const informations = base
    .prepare(
      `INSERT INTO users (pseudo, whatsapp, mot_de_passe_hache, statut)
       VALUES (?, ?, ?, ?)`
    )
    .run(`eleve-${statut}`, `+22170000${Math.floor(Math.random() * 1000)}`, "hachage-de-test", statut);
  return base.prepare("SELECT * FROM users WHERE id = ?").get(informations.lastInsertRowid);
}

const moduleOffert = base.prepare("SELECT * FROM modules WHERE offert = 1 LIMIT 1").get();
const modulePayant = base.prepare("SELECT * FROM modules WHERE offert = 0 LIMIT 1").get();
const offre500 = base.prepare("SELECT * FROM offres WHERE prix_fcfa = 500").get();
const offre1000 = base.prepare("SELECT * FROM offres WHERE prix_fcfa = 1000").get();
const offre2000 = base.prepare("SELECT * FROM offres WHERE prix_fcfa = 2000").get();

test("un module offert est ouvert à un étudiant validé, sans abonnement", () => {
  const utilisateur = creerUtilisateur("valide");
  const acces = peutAcceder(utilisateur, moduleOffert, "rappel");
  assert.equal(acces.autorise, true);
  assert.equal(acces.raison, "Module offert.");
});

test("anonyme, en attente et refusé sont refusés, même sur un module offert", () => {
  assert.equal(peutAcceder(null, moduleOffert).autorise, false);

  const enAttente = creerUtilisateur("en_attente");
  const accesAttente = peutAcceder(enAttente, moduleOffert, "rappel");
  assert.equal(accesAttente.autorise, false);
  assert.equal(accesAttente.raison, "Votre inscription est en cours de validation");
  assert.deepEqual(accesAttente.offres, []); // pas de proposition d'abonnement ici

  const refuse = creerUtilisateur("refuse");
  const accesRefuse = peutAcceder(refuse, moduleOffert, "rappel");
  assert.equal(accesRefuse.autorise, false);
  assert.equal(accesRefuse.raison, "Accès refusé.");
  assert.deepEqual(accesRefuse.offres, []);
});

test("sans abonnement, un module non offert est refusé avec proposition d'offres", () => {
  const utilisateur = creerUtilisateur("valide");
  const acces = peutAcceder(utilisateur, modulePayant, "rappel");
  assert.equal(acces.autorise, false);
  assert.match(acces.raison, /abonnement/);
  assert.deepEqual(
    acces.offres.map((offre) => offre.prix_fcfa),
    [1000, 2000] // la offre à 500 F n'inclut pas les rappels
  );
});

test("l'offre à 500 F ouvre les quiz mais pas les rappels ni les TD", () => {
  const utilisateur = creerUtilisateur("valide");
  creerAbonnement(utilisateur.id, offre500.id, 1, "");

  assert.equal(peutAcceder(utilisateur, modulePayant, "quiz").autorise, true);
  assert.equal(peutAcceder(utilisateur, modulePayant, "rappel").autorise, false);
  assert.equal(peutAcceder(utilisateur, modulePayant, "td").autorise, false);
});

test("les offres à 1 000 F et 2 000 F ouvrent rappels et TD", () => {
  const utilisateur = creerUtilisateur("valide");
  creerAbonnement(utilisateur.id, offre1000.id, 1, "");
  assert.equal(peutAcceder(utilisateur, modulePayant, "rappel").autorise, true);
  assert.equal(peutAcceder(utilisateur, modulePayant, "td").autorise, true);

  creerAbonnement(utilisateur.id, offre2000.id, 1, "");
  assert.equal(peutAcceder(utilisateur, modulePayant, "rappel").autorise, true);
});

test("un abonnement expiré n'ouvre plus l'accès", () => {
  const utilisateur = creerUtilisateur("valide");
  const id = creerAbonnement(utilisateur.id, offre1000.id, 1, "");
  assert.equal(peutAcceder(utilisateur, modulePayant, "rappel").autorise, true);

  // On recule la date de fin comme si un mois s'était écoulé.
  base.prepare("UPDATE abonnements SET date_fin = ? WHERE id = ?").run(
    "2020-01-01 00:00:00",
    id
  );
  const acces = peutAcceder(utilisateur, modulePayant, "rappel");
  assert.equal(acces.autorise, false);
  assert.equal(
    base.prepare("SELECT statut FROM abonnements WHERE id = ?").get(id).statut,
    "expire"
  );
  assert.ok(mettreAJourAbonnementsExpires() >= 0);
});

test("les fonctions de dates calculent des mois et des jours restants", () => {
  assert.equal(ajouterMois("2026-01-15 10:00:00", 1), "2026-02-15 10:00:00");
  assert.equal(ajouterMois("2026-12-15 10:00:00", 2), "2027-02-15 10:00:00");
  assert.equal(joursRestants("2020-01-01 00:00:00"), 0);
  assert.ok(joursRestants("2999-01-01 00:00:00") > 0);
});
