/*
 * services/tentatives.js
 * Moteur de quiz côté serveur : mélange, correction et règles de tentatives.
 *
 * Règles du cahier appliquées ici et nulle part ailleurs :
 *  - 3 tentatives au départ ;
 *  - réussi à 14/20 (70 %) ; module validé dès 10/20 (50 %), sinon "à revoir" ;
 *  - après 3 tentatives sans validation : 12 h d'attente, puis 2 tentatives ;
 *  - la règle recommence avec 2 tentatives après chaque nouvelle attente ;
 *  - c'est le MEILLEUR score de toutes les tentatives qui sert pour le seuil
 *    de 50 % (une mauvaise dernière tentative n'annule pas une bonne première).
 *
 * Les bonnes réponses ne sont jamais envoyées par la route de démarrage : on
 * stocke l'ordre mélangé en base et on ne calcule la correction qu'ici, quand
 * l'étudiant a soumis ses réponses.
 */

const crypto = require("node:crypto");
const {
  TOTAL_QUESTIONS,
  SEUIL_REUSSITE,
  SEUIL_VALIDATION,
} = require("./validation-contenu");

const TENTATIVES_INITIALES = 3;
const TENTATIVES_REPRISE = 2;
const DELAI_REPRISE_MS = 12 * 60 * 60 * 1000;

// Mélange de Fisher-Yates avec crypto.randomInt : chaque permutation a la même
// probabilité, contrairement à un tri sur Math.random().
function melanger(tableau) {
  const copie = [...tableau];
  for (let index = copie.length - 1; index > 0; index -= 1) {
    const autre = crypto.randomInt(0, index + 1);
    [copie[index], copie[autre]] = [copie[autre], copie[index]];
  }
  return copie;
}

function limiteDuCycle(cycle) {
  return cycle <= 1 ? TENTATIVES_INITIALES : TENTATIVES_REPRISE;
}

function questionsDuQuiz(base, quizId) {
  return base
    .prepare("SELECT * FROM questions_quiz WHERE quiz_id = ? ORDER BY ordre_original")
    .all(quizId);
}

/*
 * Prépare deux versions des 20 questions :
 *  - donneesFront : texte et choix mélangés, SANS réponse ni explication ;
 *  - donneesServeur : l'ordre des options (index d'origine), gardé en base.
 */
function preparerQuestions(questions) {
  const donneesServeur = [];
  const donneesFront = [];

  melanger(questions).forEach(function (question) {
    const choix = JSON.parse(question.choix_json);
    const ordreOptions = melanger(choix.map((texte, index) => index));

    donneesServeur.push({
      questionRef: question.question_ref,
      ordreOptions,
    });
    donneesFront.push({
      questionRef: question.question_ref,
      niveau: question.niveau,
      enonce: question.enonce,
      codeSource: question.code_source,
      choix: ordreOptions.map(function (indexOriginal, position) {
        return { position, texte: choix[indexOriginal] };
      }),
    });
  });

  return { donneesServeur, donneesFront };
}

// Quand une tentative est déjà en cours, on la réaffiche avec le même ordre :
// l'étudiant ne doit pas perdre ses réponses en rechargeant la page.
function reconstituerQuestions(base, quizId, donneesServeur) {
  const questions = questionsDuQuiz(base, quizId);
  const parRef = new Map(questions.map((question) => [question.question_ref, question]));

  return donneesServeur.map(function (element) {
    const question = parRef.get(element.questionRef);
    const choix = JSON.parse(question.choix_json);
    return {
      questionRef: question.question_ref,
      niveau: question.niveau,
      enonce: question.enonce,
      codeSource: question.code_source,
      choix: element.ordreOptions.map(function (indexOriginal, position) {
        return { position, texte: choix[indexOriginal] };
      }),
    };
  });
}

function lireTentatives(base, utilisateurId, moduleId) {
  return base
    .prepare(
      `SELECT * FROM tentatives_quiz
       WHERE utilisateur_id = ? AND module_id = ?
       ORDER BY id`
    )
    .all(utilisateurId, moduleId);
}

/*
 * Calcule l'état actuel des tentatives. On renvoie toujours :
 *  - cycle : 1 pour les 3 premières, 2+ pour les reprises de 2 ;
 *  - restantes : tentatives encore utilisables maintenant ;
 *  - attenteMs : temps restant avant une nouvelle tentative (0 si aucune) ;
 *  - tentativeEnCours : une tentative non corrigée, s'il y en a une.
 */
function etatTentatives(base, utilisateurId, moduleId, maintenant) {
  const maintenantMs = maintenant || Date.now();
  const lignes = lireTentatives(base, utilisateurId, moduleId);
  const terminees = lignes.filter((ligne) => ligne.score !== null);
  const meilleures = terminees.map((ligne) => ligne.score);
  const meilleurScore = meilleures.length > 0 ? Math.max(...meilleures) : null;
  const valide = meilleurScore !== null && meilleurScore >= SEUIL_VALIDATION;

  const commun = {
    nombreTentatives: lignes.length,
    meilleurScore,
    valide,
    attenteMs: 0,
  };

  const enCours = lignes.find((ligne) => ligne.score === null);
  if (enCours) {
    const dansCycle = lignes.filter((ligne) => ligne.cycle === enCours.cycle).length;
    return {
      ...commun,
      cycle: enCours.cycle,
      limite: limiteDuCycle(enCours.cycle),
      restantes: Math.max(0, limiteDuCycle(enCours.cycle) - dansCycle),
      tentativeEnCours: enCours,
    };
  }

  if (lignes.length === 0) {
    return {
      ...commun,
      cycle: 1,
      limite: TENTATIVES_INITIALES,
      restantes: TENTATIVES_INITIALES,
      tentativeEnCours: null,
    };
  }

  const dernierCycle = Math.max(...lignes.map((ligne) => ligne.cycle));
  const dansCycle = lignes.filter((ligne) => ligne.cycle === dernierCycle).length;
  const limite = limiteDuCycle(dernierCycle);

  if (dansCycle < limite) {
    return {
      ...commun,
      cycle: dernierCycle,
      limite,
      restantes: limite - dansCycle,
      tentativeEnCours: null,
    };
  }

  const prochainCycle = dernierCycle + 1;

  // Une fois le module validé, l'étudiant peut le refaire sans attendre : le
  // délai de 12 h ne sert qu'à relancer les étudiants sous 50 %.
  if (valide) {
    return {
      ...commun,
      cycle: prochainCycle,
      limite: TENTATIVES_REPRISE,
      restantes: TENTATIVES_REPRISE,
      tentativeEnCours: null,
    };
  }

  const derniere = lignes[lignes.length - 1];
  const finMs =
    derniere.date_fin_ms || new Date(`${derniere.date_fin}Z`).getTime();
  const attenteMs = Math.max(
    0,
    finMs + DELAI_REPRISE_MS - maintenantMs
  );

  return {
    ...commun,
    cycle: prochainCycle,
    limite: TENTATIVES_REPRISE,
    restantes: attenteMs > 0 ? 0 : TENTATIVES_REPRISE,
    attenteMs,
    tentativeEnCours: null,
  };
}

/*
 * Démarre une tentative. Si une tentative non corrigée existe déjà, on la
 * renvoie (même ordre des questions) au lieu d'en créer une deuxième : c'est
 * ce qui empêche de contourner la limite en rechargeant la page.
 */
function demarrerTentative(base, utilisateurId, moduleId, quizId, maintenant) {
  const maintenantMs = maintenant || Date.now();
  const etat = etatTentatives(base, utilisateurId, moduleId, maintenantMs);

  if (etat.attenteMs > 0) {
    return { refuse: true, attenteMs: etat.attenteMs, etat };
  }

  if (etat.tentativeEnCours) {
    const enCours = etat.tentativeEnCours;
    const questions = reconstituerQuestions(
      base,
      quizId,
      JSON.parse(enCours.questions_json)
    );
    return {
      tentative: {
        id: enCours.id,
        cycle: enCours.cycle,
        numeroTentative: enCours.numero_tentative,
        tentativesRestantes: etat.restantes,
      },
      questions,
      etat,
    };
  }

  const questions = questionsDuQuiz(base, quizId);
  if (questions.length !== TOTAL_QUESTIONS) {
    throw new Error("Ce quiz ne contient pas 20 questions : publication impossible.");
  }

  const preparees = preparerQuestions(questions);
  const resultat = base
    .prepare(
      `INSERT INTO tentatives_quiz
         (utilisateur_id, module_id, cycle, numero_tentative, questions_json, total)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      utilisateurId,
      moduleId,
      etat.cycle,
      etat.nombreTentatives + 1,
      JSON.stringify(preparees.donneesServeur),
      TOTAL_QUESTIONS
    );

  return {
    tentative: {
      id: Number(resultat.lastInsertRowid),
      cycle: etat.cycle,
      numeroTentative: etat.nombreTentatives + 1,
        tentativesRestantes: Math.max(0, etat.restantes - 1),
    },
    questions: preparees.donneesFront,
    etat,
  };
}

/*
 * Corrige une tentative à la soumission. L'étudiant envoie seulement des
 * positions (0 à 3) : le serveur retrouve l'index d'origine grâce à
 * ordreOptions, compare avec reponse_index, puis calcule le score.
 */
function corrigerTentative(base, utilisateurId, tentativeId, reponses, maintenant) {
  const maintenantMs = maintenant || Date.now();
  const tentative = base
    .prepare(
      `SELECT t.*, q.id AS quiz_id
       FROM tentatives_quiz t JOIN quiz q ON q.module_id = t.module_id
       WHERE t.id = ? AND t.utilisateur_id = ?`
    )
    .get(tentativeId, utilisateurId);

  if (!tentative) {
    return { erreur: "Tentative introuvable." };
  }
  if (tentative.score !== null) {
    return { erreur: "Cette tentative est déjà corrigée." };
  }

  const ordreQuestions = JSON.parse(tentative.questions_json);
  if (!Array.isArray(reponses) || reponses.length !== TOTAL_QUESTIONS) {
    return { erreur: `Il faut envoyer ${TOTAL_QUESTIONS} réponses.` };
  }

  const refPermises = new Set(ordreQuestions.map((element) => element.questionRef));
  const recues = new Map();
  for (const reponse of reponses) {
    if (!reponse || !refPermises.has(reponse.questionRef)) {
      return { erreur: "Une réponse ne correspond à aucune question du quiz." };
    }
    if (!Number.isInteger(reponse.index) || reponse.index < 0 || reponse.index > 3) {
      return { erreur: "Chaque réponse doit être une position de 0 à 3." };
    }
    if (recues.has(reponse.questionRef)) {
      return { erreur: "Une question a reçu deux réponses." };
    }
    recues.set(reponse.questionRef, reponse.index);
  }
  if (recues.size !== TOTAL_QUESTIONS) {
    return { erreur: `Il faut répondre aux ${TOTAL_QUESTIONS} questions.` };
  }

  const questions = questionsDuQuiz(base, tentative.quiz_id);
  const parRef = new Map(questions.map((question) => [question.question_ref, question]));

  const correction = ordreQuestions.map(function (element) {
    const question = parRef.get(element.questionRef);
    const choix = JSON.parse(question.choix_json);
    const positionDonnee = recues.get(element.questionRef);
    const indexOriginalDonne = element.ordreOptions[positionDonnee];
    const estCorrect = indexOriginalDonne === question.reponse_index;

    return {
      questionRef: question.question_ref,
      enonce: question.enonce,
      codeSource: question.code_source,
      estCorrect,
      positionDonnee,
      reponseDonneeTexte: choix[indexOriginalDonne],
      bonneReponsePosition: element.ordreOptions.indexOf(question.reponse_index),
      bonneReponseTexte: choix[question.reponse_index],
      explication: question.explication,
    };
  });

  const score = correction.filter((element) => element.estCorrect).length;
  const reussi = score >= SEUIL_REUSSITE ? 1 : 0;

  /*
   * Le cahier conserve le MEILLEUR score pour le seuil de 50 %. Si l'étudiant a
   * déjà validé le module, une tentative plus faible ne doit donc pas le faire
   * apparaître comme « non validé » dans le résultat rendu au front.
   */
  const etatAvant = etatTentatives(
    base,
    utilisateurId,
    tentative.module_id,
    maintenantMs
  );
  const valideModule =
    etatAvant.valide || score >= SEUIL_VALIDATION ? 1 : 0;
  const dateFin = new Date(maintenantMs).toISOString().replace("T", " ").slice(0, 19);

  base
    .prepare(
      `UPDATE tentatives_quiz
       SET reponses_json = ?, correction_json = ?, score = ?, total = ?,
           reussi = ?, valide_module = ?, date_fin = ?, date_fin_ms = ?
       WHERE id = ?`
    )
    .run(
      JSON.stringify(reponses),
      JSON.stringify(correction),
      score,
      TOTAL_QUESTIONS,
      reussi,
      valideModule,
      dateFin,
      maintenantMs,
      tentativeId
    );

  const etat = etatTentatives(
    base,
    utilisateurId,
    tentative.module_id,
    maintenantMs
  );

  let statut = "non_valide";
  if (reussi) {
    statut = "reussi";
  } else if (valideModule) {
    statut = "a_revoir";
  }

  return {
    tentativeId,
    score,
    total: TOTAL_QUESTIONS,
    seuilReussite: SEUIL_REUSSITE,
    seuilValidation: SEUIL_VALIDATION,
    reussi: Boolean(reussi),
    valideModule: Boolean(valideModule),
    statut,
    correction,
    meilleurScore: etat.meilleurScore,
    tentativesRestantes: etat.restantes,
    attenteMs: etat.attenteMs,
  };
}

module.exports = {
  TENTATIVES_INITIALES,
  TENTATIVES_REPRISE,
  DELAI_REPRISE_MS,
  melanger,
  etatTentatives,
  demarrerTentative,
  corrigerTentative,
};
