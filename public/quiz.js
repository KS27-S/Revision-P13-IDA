/*
 * quiz.js
 * Affiche le quiz et son écran de résultat. Le navigateur ne connaît ni la
 * bonne réponse ni l'explication avant la correction renvoyée par le serveur.
 *
 * Les questions et les choix arrivent déjà mélangés par /api/quiz. Ici on ne
 * fait que construire le formulaire ; le score et le statut sont calculés côté
 * serveur, jamais ici (sinon ce serait contournable).
 */

const zoneTitre = document.getElementById("titre-quiz");
const zoneSousTitre = document.getElementById("sous-titre-quiz");
const zoneMessage = document.getElementById("message-quiz");
const zoneOffres = document.getElementById("offres-quiz");
const formulaireQuiz = document.getElementById("formulaire-quiz");
const zoneResultat = document.getElementById("resultat-quiz");

const parametres = new URLSearchParams(window.location.search);
const matiereSlug = parametres.get("matiere") || "";
const moduleSlug = parametres.get("module") || "";

let tentativeId = null;
let questionsAffichees = [];

function creerElement(balise, classe, texte) {
  const element = document.createElement(balise);
  if (classe) {
    element.className = classe;
  }
  if (texte !== undefined) {
    element.textContent = texte;
  }
  return element;
}

function vider(element) {
  element.replaceChildren();
}

function afficherMessage(texte, offres) {
  vider(zoneMessage);
  vider(zoneOffres);
  if (texte) {
    zoneMessage.appendChild(creerElement("p", "", texte));
  }
  if (Array.isArray(offres) && offres.length > 0) {
    zoneOffres.appendChild(creerElement("p", "", "Offres qui donnent accès à ce quiz :"));
    const liste = creerElement("ul");
    offres.forEach(function (offre) {
      liste.appendChild(
        creerElement("li", "", `${offre.nom} — ${offre.prix_fcfa} F / mois`)
      );
    });
    zoneOffres.appendChild(liste);
  }
}

async function lireReponse(reponse) {
  const resultat = await reponse.json();
  if (!reponse.ok) {
    if (reponse.status === 401) {
      window.location.replace("connexion.html");
      throw new Error("Connexion requise");
    }
    const erreur = new Error(resultat.erreur || "Requête refusée.");
    erreur.donnees = resultat;
    throw erreur;
  }
  return resultat;
}

// Formate une attente en heures/minutes pour un affichage lisible.
function formaterAttente(millisecondes) {
  if (!millisecondes || millisecondes <= 0) {
    return "";
  }
  const minutes = Math.ceil(millisecondes / 60000);
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (heures === 0) {
    return `${reste} minute(s)`;
  }
  return `${heures} heure(s) ${reste} minute(s)`;
}

function afficherQuestion(question, numero) {
  const bloc = creerElement("fieldset", "question-bloc");
  const legende = creerElement(
    "legend",
    "",
    `${numero}. ${question.enonce} — niveau ${question.niveau}`
  );
  bloc.appendChild(legende);

  if (question.codeSource) {
    const code = creerElement("code", "", question.codeSource);
    const pre = creerElement("pre", "extrait-code");
    pre.appendChild(code);
    bloc.appendChild(pre);
  }

  question.choix.forEach(function (choix, index) {
    const label = creerElement("label", "option-reponse");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = question.questionRef;
    input.value = String(choix.position);
    // Une seule question sur vingt suffit à bloquer l'envoi : le serveur
    // vérifiera de toute façon qu'il y a bien 20 réponses.
    input.required = index === 0;
    label.appendChild(input);
    label.appendChild(creerElement("span", "", choix.texte));
    bloc.appendChild(label);
  });
  return bloc;
}

function afficherQuiz(donnees) {
  tentativeId = donnees.tentative.id;
  questionsAffichees = donnees.questions;

  zoneTitre.textContent = donnees.moduleTitre || "Quiz";
  zoneSousTitre.textContent =
    `${donnees.matiereNom || donnees.matiere} — tentative n°${donnees.tentative.numeroTentative}` +
    ` — ${donnees.tentative.tentativesRestantes} restante(s)`;
  afficherMessage("");

  vider(formulaireQuiz);
  donnees.questions.forEach(function (question, index) {
    formulaireQuiz.appendChild(afficherQuestion(question, index + 1));
  });
  const bouton = creerElement("button", "btn", "Corriger mon quiz");
  bouton.type = "submit";
  formulaireQuiz.appendChild(bouton);
  formulaireQuiz.hidden = false;
  vider(zoneResultat);
  zoneResultat.hidden = true;
}

function afficherCorrection(resultat) {
  vider(formulaireQuiz);
  formulaireQuiz.hidden = true;
  vider(zoneResultat);
  zoneResultat.hidden = false;

  zoneResultat.appendChild(creerElement("h2", "", "Résultat du quiz"));
  zoneResultat.appendChild(
    creerElement(
      "p",
      "resultat-score",
      `${resultat.score} / ${resultat.total} — seuil de réussite : ${resultat.seuilReussite}/20`
    )
  );

  const statuts = {
    reussi: "Réussi : bravo !",
    a_revoir: "Module validé, mais à revoir (entre 10 et 13/20).",
    non_valide: "Non validé : il faut au moins 10/20 pour valider le module.",
  };
  zoneResultat.appendChild(
    creerElement("p", "", statuts[resultat.statut] || resultat.statut)
  );
  zoneResultat.appendChild(
    creerElement(
      "p",
      "",
      `Tentatives restantes dans ce cycle : ${resultat.tentativesRestantes}.`
    )
  );
  if (resultat.meilleurScore !== null) {
    zoneResultat.appendChild(
      creerElement("p", "", `Meilleur score enregistré : ${resultat.meilleurScore}/20.`)
    );
  }
  const attente = formaterAttente(resultat.attenteMs);
  if (attente) {
    zoneResultat.appendChild(
      creerElement("p", "message-erreur", `Nouvelle tentative possible dans ${attente}.`)
    );
  }

  const erreurs = resultat.correction.filter(function (element) {
    return !element.estCorrect;
  });
  if (erreurs.length === 0) {
    zoneResultat.appendChild(
      creerElement("p", "etat-badge etat-badge--reussi", "Aucune erreur.")
    );
  } else {
    zoneResultat.appendChild(
      creerElement("h3", "", `Correction de vos ${erreurs.length} erreur(s)`)
    );
    erreurs.forEach(function (element, index) {
      const article = creerElement("article", "correction-ligne");
      article.appendChild(
        creerElement("h4", "", `Erreur ${index + 1} — ${element.enonce}`)
      );
      article.appendChild(
        creerElement("p", "", `Votre réponse : ${element.reponseDonneeTexte}`)
      );
      article.appendChild(
        creerElement("p", "", `Bonne réponse : ${element.bonneReponseTexte}`)
      );
      article.appendChild(
        creerElement("p", "", `Explication : ${element.explication}`)
      );
      zoneResultat.appendChild(article);
    });
  }

  const bouton = creerElement("button", "btn", "Refaire ce quiz");
  bouton.type = "button";
  bouton.addEventListener("click", function () {
    window.location.reload();
  });
  zoneResultat.appendChild(bouton);
}

async function chargerQuiz() {
  if (!matiereSlug || !moduleSlug) {
    afficherMessage("Module non précisé dans l'adresse.");
    return;
  }
  zoneSousTitre.textContent = "Chargement du quiz…";
  try {
    const reponse = await fetch(
      `/api/quiz/${encodeURIComponent(matiereSlug)}/${encodeURIComponent(moduleSlug)}`,
      { headers: { Accept: "application/json" } }
    );
    const donnees = await lireReponse(reponse);
    afficherQuiz(donnees);
  } catch (erreur) {
    if (erreur.message === "Connexion requise") {
      return;
    }
    afficherMessage(erreur.message, erreur.donnees && erreur.donnees.offres);
  }
}

formulaireQuiz.addEventListener("submit", async function (evenement) {
  evenement.preventDefault();
  if (!tentativeId) {
    return;
  }

  const reponses = questionsAffichees.map(function (question) {
    const cochee = formulaireQuiz.querySelector(
      `input[name="${CSS.escape(question.questionRef)}"]:checked`
    );
    return {
      questionRef: question.questionRef,
      index: cochee ? Number(cochee.value) : -1,
    };
  });

  const bouton = formulaireQuiz.querySelector('button[type="submit"]');
  if (bouton) {
    bouton.disabled = true;
    bouton.textContent = "Correction en cours…";
  }
  try {
    const reponse = await fetch(`/api/quiz/${tentativeId}/reponses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ reponses }),
    });
    const resultat = await lireReponse(reponse);
    afficherCorrection(resultat);
  } catch (erreur) {
    if (erreur.message !== "Connexion requise") {
      afficherMessage(erreur.message);
      formulaireQuiz.hidden = false;
      if (bouton) {
        bouton.disabled = false;
        bouton.textContent = "Corriger mon quiz";
      }
    }
  }
});

chargerQuiz();
