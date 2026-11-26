/*
 * services/validation-contenu.js
 * Vérifie les fichiers de contenu selon les règles du cahier des charges.
 *
 * Pourquoi ce service est séparé de l'import : la même vérification sert à
 * deux endroits. L'import décide s'il peut enregistrer le fichier, et l'admin
 * décide si un contenu est assez complet pour être publié. Une seule source
 * de vérité évite que les deux réponses divergent.
 */

const TOTAL_QUESTIONS = 20;
const NIVEAUX_ATTENDUS = { facile: 7, moyen: 7, difficile: 6 };
const NOMBRE_CHOIX = 4;
const SEUIL_REUSSITE = 14; // 14/20 = 70 % : le quiz est "réussi".
const SEUIL_VALIDATION = 10; // 10/20 = 50 % : le module est validé, "à revoir".

function estTexteRempli(valeur) {
  return typeof valeur === "string" && valeur.trim().length > 0;
}

/*
 * Un quiz est complet quand il a exactement 20 questions, la répartition
 * 7 faciles / 7 moyennes / 6 difficiles, 4 choix, une bonne réponse valide
 * et une explication pour chaque question.
 */
function validerQuiz(donnees) {
  const erreurs = [];
  if (!donnees || typeof donnees !== "object" || !Array.isArray(donnees.questions)) {
    return {
      structureValide: false,
      complet: false,
      estVide: true,
      erreurs: ["Le fichier doit contenir une clé 'questions' (tableau)."],
      stats: { questions: 0, niveaux: {} },
    };
  }

  const questions = donnees.questions;
  const niveaux = {};
  const identifiants = new Set();

  questions.forEach(function (question, index) {
    const prefixe = `question ${index + 1}`;
    niveaux[question.niveau] = (niveaux[question.niveau] || 0) + 1;

    if (!Object.hasOwn(NIVEAUX_ATTENDUS, question.niveau)) {
      erreurs.push(`${prefixe} : niveau inconnu '${question.niveau}'.`);
    }
    if (!estTexteRempli(question.enonce)) {
      erreurs.push(`${prefixe} : énoncé manquant.`);
    }
    if (!Array.isArray(question.choix) || question.choix.length !== NOMBRE_CHOIX) {
      erreurs.push(`${prefixe} : il faut exactement 4 choix.`);
    }
    if (
      !Number.isInteger(question.reponse) ||
      question.reponse < 0 ||
      question.reponse >= NOMBRE_CHOIX
    ) {
      erreurs.push(`${prefixe} : la bonne réponse doit être un index de 0 à 3.`);
    }
    if (!estTexteRempli(question.explication)) {
      erreurs.push(`${prefixe} : explication manquante.`);
    }
    if (!estTexteRempli(question.id)) {
      erreurs.push(`${prefixe} : identifiant manquant.`);
    } else if (identifiants.has(question.id)) {
      erreurs.push(`${prefixe} : identifiant '${question.id}' en double.`);
    } else {
      identifiants.add(question.id);
    }
  });

  if (questions.length !== TOTAL_QUESTIONS) {
    erreurs.push(`Le quiz doit contenir 20 questions (trouvé : ${questions.length}).`);
  }
  Object.entries(NIVEAUX_ATTENDUS).forEach(function ([niveau, attendu]) {
    if ((niveaux[niveau] || 0) !== attendu) {
      erreurs.push(
        `Il faut ${attendu} questions '${niveau}' (trouvé : ${niveaux[niveau] || 0}).`
      );
    }
  });

  const estVide = questions.length === 0;
  return {
    structureValide: erreurs.length === 0,
    complet: erreurs.length === 0,
    estVide,
    erreurs,
    stats: { questions: questions.length, niveaux },
  };
}

/*
 * Format TD attendu par le cahier : enoncé simplifié, indices, solution et
 * explication simple. La variante "qcm" trouvée dans un fichier existant est
 * signalée comme incomplète : c'est à l'administrateur de décider, pas à nous
 * de convertir le contenu.
 */
function validerTD(donnees) {
  const erreurs = [];
  if (!donnees || typeof donnees !== "object" || !Array.isArray(donnees.exercices)) {
    return {
      structureValide: false,
      complet: false,
      estVide: true,
      erreurs: ["Le fichier doit contenir une clé 'exercices' (tableau)."],
      stats: { exercices: 0 },
    };
  }

  const exercices = donnees.exercices;
  const identifiants = new Set();

  exercices.forEach(function (exercice, index) {
    const prefixe = `exercice ${index + 1}`;
    if (!estTexteRempli(exercice.id)) {
      erreurs.push(`${prefixe} : identifiant manquant.`);
    } else if (identifiants.has(exercice.id)) {
      erreurs.push(`${prefixe} : identifiant '${exercice.id}' en double.`);
    } else {
      identifiants.add(exercice.id);
    }
    [
      ["enonce_simple", "énoncé simplifié"],
      ["solution", "solution"],
      ["explication_simple", "explication simple"],
    ].forEach(function ([champ, libelle]) {
      if (!estTexteRempli(exercice[champ])) {
        erreurs.push(`${prefixe} : ${libelle} ('${champ}') manquant.`);
      }
    });
    if (!Array.isArray(exercice.indices) || exercice.indices.length === 0) {
      erreurs.push(`${prefixe} : au moins un indice est attendu.`);
    }
  });

  const estVide = exercices.length === 0;
  return {
    structureValide: estVide || erreurs.length === 0,
    complet: !estVide && erreurs.length === 0,
    estVide,
    erreurs,
    stats: { exercices: exercices.length },
  };
}

module.exports = {
  TOTAL_QUESTIONS,
  NIVEAUX_ATTENDUS,
  NOMBRE_CHOIX,
  SEUIL_REUSSITE,
  SEUIL_VALIDATION,
  validerQuiz,
  validerTD,
};
