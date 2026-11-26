/*
 * scripts/init-contenu.js
 * Remplit la base avec le contenu de départ : les matières et les modules lus
 * dans public/revision.html, puis les trois offres décrites dans le cahier des
 * charges (section 4.5).
 *
 * Pourquoi lire revision.html au lieu de recopier les noms : ce fichier est la
 * source actuelle des 8 matières et des 37 modules. Si un titre y est corrigé,
 * il suffit de relancer ce script pour mettre la base à jour.
 *
 * Pourquoi INSERT ... ON CONFLICT : le script doit pouvoir être relancé sans
 * créer de doublons ni effacer les abonnements déjà enregistrés.
 */

const fs = require("node:fs");
const path = require("node:path");

// Les trois offres sont copiées mot pour mot du cahier des charges. On n'invente
// aucun nom commercial : le cahier ne donne que les prix et ce qu'ils incluent.
const OFFRES_DU_CAHIER = [
  {
    slug: "offre-500",
    nom: "500 F par mois",
    prix_fcfa: 500,
    // "les quiz de toutes les matières" (cahier 4.5).
    inclut_quiz: 1,
    inclut_rappel: 0,
    inclut_td: 0,
    // 10 messages par jour sont offerts à tous (cahier 4.3 et 4.5).
    messages_ia_par_jour: 10,
  },
  {
    slug: "offre-1000",
    nom: "1 000 F par mois",
    prix_fcfa: 1000,
    // "quiz, rappel de cours et TD" (cahier 4.5).
    inclut_quiz: 1,
    inclut_rappel: 1,
    inclut_td: 1,
    messages_ia_par_jour: 10,
  },
  {
    slug: "offre-2000",
    nom: "2 000 F par mois",
    prix_fcfa: 2000,
    // Idem, avec l'assistant porté à 50 messages par jour (cahier 4.3 et 4.5).
    inclut_quiz: 1,
    inclut_rappel: 1,
    inclut_td: 1,
    messages_ia_par_jour: 50,
  },
];

// Petit utilitaire : récupère le premier texte qui correspond, ou "".
function extraireTexte(bloc, expression) {
  const resultat = expression.exec(bloc);
  return resultat ? resultat[1].trim().replace(/\s+/g, " ") : "";
}

// Lit revision.html et renvoie un tableau de matières, chacune avec ses modules.
function lireMatieresDepuisHtml(cheminRevision) {
  const html = fs.readFileSync(cheminRevision, "utf8");
  const matieres = [];

  // Une carte de matière commence par <article ...> et se termine par </article>.
  const expressionMatiere =
    /<article class="matiere-carte" data-matiere-id="([^"]+)">([\s\S]*?)<\/article>/g;
  let matiere;

  while ((matiere = expressionMatiere.exec(html)) !== null) {
    const blocMatiere = matiere[2];
    const modules = [];

    // Dans chaque carte, chaque module est une ligne <li class="module-ligne">.
    const expressionModule =
      /<li class="module-ligne" data-module-id="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g;
    let module;

    while ((module = expressionModule.exec(blocMatiere)) !== null) {
      const titre = extraireTexte(
        module[2],
        /<span class="module-nom">([^<]+)<\/span>/
      );
      if (titre) {
        modules.push({ slug: module[1], titre });
      }
    }

    const nom = extraireTexte(blocMatiere, /<h2>([^<]+)<\/h2>/);
    if (nom && modules.length > 0) {
      matieres.push({ slug: matiere[1], nom, modules });
    }
  }

  return matieres;
}

/*
 * Remplit (ou met à jour) les tables. "base" est reçu en paramètre pour que
 * les tests puissent utiliser une base temporaire sans toucher à la vraie.
 */
function initialiserContenu(base, cheminRevision) {
  const cheminParDefaut = path.resolve(
    __dirname,
    "..",
    "public",
    "revision.html"
  );
  const matieres = lireMatieresDepuisHtml(cheminRevision || cheminParDefaut);

  if (matieres.length === 0) {
    throw new Error("Aucune matière trouvée dans revision.html.");
  }

  // Tout se fait dans une transaction : si une erreur survient au milieu, on
  // ne garde pas une base à moitié remplie.
  const inserer = base.transaction(() => {
    const enregistrerMatiere = base.prepare(
      `INSERT INTO matieres (slug, nom, ordre_affichage)
       VALUES (?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET nom = excluded.nom,
                                        ordre_affichage = excluded.ordre_affichage`
    );
    const enregistrerModule = base.prepare(
      `INSERT INTO modules (matiere_id, slug, titre, ordre_affichage, offert)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(matiere_id, slug) DO UPDATE SET
         titre = excluded.titre,
         ordre_affichage = excluded.ordre_affichage,
         offert = excluded.offert`
    );
    const enregistrerOffre = base.prepare(
      `INSERT INTO offres
         (slug, nom, prix_fcfa, duree_mois, inclut_quiz, inclut_rappel, inclut_td,
          messages_ia_par_jour)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         nom = excluded.nom, prix_fcfa = excluded.prix_fcfa,
         duree_mois = excluded.duree_mois, inclut_quiz = excluded.inclut_quiz,
         inclut_rappel = excluded.inclut_rappel, inclut_td = excluded.inclut_td,
         messages_ia_par_jour = excluded.messages_ia_par_jour`
    );

    matieres.forEach(function (matiere, indexMatiere) {
      enregistrerMatiere.run(matiere.slug, matiere.nom, indexMatiere + 1);
      // On relit l'id par son slug : cela marche aussi bien à la première
      // exécution (INSERT) que lors d'une mise à jour (ON CONFLICT).
      const matiereId = base
        .prepare("SELECT id FROM matieres WHERE slug = ?")
        .get(matiere.slug).id;

      matiere.modules.forEach(function (module, indexModule) {
        // Cahier 4.5 : le premier module de chaque matière est offert.
        const offert = indexModule === 0 ? 1 : 0;
        enregistrerModule.run(
          matiereId,
          module.slug,
          module.titre,
          indexModule + 1,
          offert
        );
      });
    });

    OFFRES_DU_CAHIER.forEach(function (offre) {
      enregistrerOffre.run(
        offre.slug,
        offre.nom,
        offre.prix_fcfa,
        offre.inclut_quiz,
        offre.inclut_rappel,
        offre.inclut_td,
        offre.messages_ia_par_jour
      );
    });
  });

  inserer();

  // Le script affiche ce qu'il a fait : utile pour vérifier l'import à l'œil.
  const totalModules = base.prepare("SELECT COUNT(*) AS total FROM modules").get().total;
  const totalOfferts = base.prepare("SELECT COUNT(*) AS total FROM modules WHERE offert = 1").get().total;
  return {
    matieres: matieres.length,
    modules: totalModules,
    offres: OFFRES_DU_CAHIER.length,
    offerts: totalOfferts,
  };
}

// Quand on lance "npm run init-contenu", ce fichier est le programme principal.
// Quand un test le require, on ne fait que renvoyer la fonction (effet de bord
// évité).
if (require.main === module) {
  require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
  });
  const base = require("../db/connexion");
  try {
    const resultat = initialiserContenu(base);
    console.log(
      `Contenu initialisé : ${resultat.matieres} matières, ${resultat.modules} modules ` +
        `(${resultat.offerts} offerts), ${resultat.offres} offres.`
    );
  } catch (erreur) {
    console.error("Initialisation impossible :", erreur.message);
    process.exitCode = 1;
  } finally {
    base.close();
  }
}

module.exports = { initialiserContenu, lireMatieresDepuisHtml, OFFRES_DU_CAHIER };
