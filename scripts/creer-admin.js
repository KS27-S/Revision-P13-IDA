/*
 * scripts/creer-admin.js
 * Création du premier compte administrateur depuis le terminal.
 *
 * Pourquoi un script et pas une ligne dans le code : le mot de passe est saisi
 * par la personne qui installe le site. Il n'est jamais écrit dans un fichier,
 * et il est haché avec bcrypt avant d'être enregistré.
 *
 * Lancement : npm run creer-admin
 */

const readline = require("node:readline");
const path = require("node:path");
const bcrypt = require("bcrypt");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const base = require("../db/connexion");
const { validerInscription } = require("../middleware/validation");

// En mode normal (vrai terminal), readline pose les questions une par une.
// L'interface n'est créée que dans ce cas pour ne pas consommer les lignes
// quand l'entrée est redirigée depuis un fichier ou un tuyau.
const interfaceTerminal = process.stdin.isTTY
  ? readline.createInterface({ input: process.stdin, output: process.stdout })
  : null;

function question(texte) {
  return new Promise((resoudre) =>
    interfaceTerminal.question(texte, resoudre)
  );
}

// Quand l'entrée est redirigée, on lit toutes les lignes d'un coup. Cela permet
// aussi de tester le script avec : pseudo, numéro, mot de passe sur 3 lignes.
function lireLignesRedirigees() {
  if (process.stdin.isTTY) {
    return Promise.resolve(null);
  }

  return new Promise((resoudre) => {
    process.stdin.setEncoding("utf8");
    let contenu = "";
    process.stdin.on("data", (morceau) => {
      contenu += morceau;
    });
    process.stdin.on("end", () => resoudre(contenu.split(/\r?\n/)));
  });
}

// Quand le terminal le permet, on remplace les caractères saisis par des *.
function demanderMotDePasse() {
  return new Promise((resoudre) => {
    process.stdout.write("Mot de passe (non affiché) : ");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    let valeur = "";

    function terminer() {
      process.stdin.removeListener("data", surCaractere);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      resoudre(valeur);
    }

    function surCaractere(caractere) {
      if (caractere === "\n" || caractere === "\r") {
        return terminer();
      }
      if (caractere === "\u0003") {
        // Ctrl+C : on quitte proprement.
        process.stdout.write("\n");
        process.exit(1);
      }
      if (caractere === "\u007f" || caractere === "\b") {
        // Retour arrière : on efface le dernier caractère mémorisé.
        valeur = valeur.slice(0, -1);
        return;
      }
      if (caractere >= " ") {
        valeur += caractere;
        process.stdout.write("*");
      }
    }

    process.stdin.on("data", surCaractere);
  });
}

async function creerAdmin() {
  console.log("Création du premier compte administrateur IDA P13.\n");

  const lignes = await lireLignesRedirigees();

  let pseudo;
  let numero;
  let motDePasse;

  if (lignes) {
    // Mode redirigé : rien n'est saisi au clavier, on utilise les 3 lignes.
    pseudo = lignes[0] || "";
    numero = lignes[1] || "";
    motDePasse = lignes[2] || "";
  } else {
    pseudo = await question("Pseudo : ");
    numero = await question("Numéro WhatsApp : ");
    motDePasse = await demanderMotDePasse();
  }

  const resultat = validerInscription({
    pseudo,
    whatsapp: numero,
    mot_de_passe: motDePasse,
  });

  if (!resultat.valide) {
    console.error("\nInformations refusées :", resultat.erreurs.join(" "));
    process.exitCode = 1;
    return;
  }

  try {
    // On n'autorise qu'un seul admin créé par ce script.
    const adminExistant = base.prepare("SELECT 1 FROM users WHERE role = 'admin'").get();
    if (adminExistant) {
      console.error("\nUn compte administrateur existe déjà.");
      process.exitCode = 1;
      return;
    }

    const { pseudo: pseudoPropre, whatsapp, motDePasse: motDePassePropre } =
      resultat.donnees;
    const hache = await bcrypt.hash(motDePassePropre, 12);

    base
      .prepare(
        `INSERT INTO users
           (pseudo, whatsapp, mot_de_passe_hache, statut, role)
         VALUES (?, ?, ?, 'valide', 'admin')`
      )
      .run(pseudoPropre, whatsapp, hache);

    console.log(`\nCompte administrateur créé pour ${pseudoPropre}.`);
  } catch (erreur) {
    if (erreur.code && erreur.code.startsWith("SQLITE_CONSTRAINT")) {
      console.error("\nCe numéro est déjà utilisé par un autre compte.");
    } else {
      console.error("\nImpossible de créer le compte administrateur.");
    }
    process.exitCode = 1;
  }
}

creerAdmin()
  .catch(() => {
    console.error("\nErreur inattendue pendant la création du compte.");
    process.exitCode = 1;
  })
  .finally(() => {
    if (interfaceTerminal) {
      interfaceTerminal.close();
    }
  });
