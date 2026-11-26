/*
 * td.js
 * Affiche les exercices, enregistre le travail de l'étudiant puis affiche la
 * correction du support pédagogique une fois le travail déposé.
 *
 * Pas de correction automatique ici : le serveur ne renvoie la correction
 * qu'après un rendu. L'emplacement prévu pour une vérification IA plus tard est
 * commenté dans routes/td.js ; cette page ne fait que refléter la décision
 * du serveur.
 */

const zoneTitre = document.getElementById("titre-td");
const zoneSousTitre = document.getElementById("sous-titre-td");
const zoneMessage = document.getElementById("message-td");
const zoneOffres = document.getElementById("offres-td");
const listeExercices = document.getElementById("liste-exercices");
const zoneCorrection = document.getElementById("correction-td");

const parametres = new URLSearchParams(window.location.search);
const matiereSlug = parametres.get("matiere") || "";
const moduleSlug = parametres.get("module") || "";

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

function afficherMessage(texte, offres) {
  zoneMessage.replaceChildren();
  zoneOffres.replaceChildren();
  if (texte) {
    zoneMessage.appendChild(creerElement("p", "", texte));
  }
  if (Array.isArray(offres) && offres.length > 0) {
    zoneOffres.appendChild(creerElement("p", "", "Offres qui donnent accès à ce TD :"));
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

function ajouterListe(conteneur, titre, valeurs) {
  if (!Array.isArray(valeurs) || valeurs.length === 0) {
    return;
  }
  conteneur.appendChild(creerElement("p", "", titre));
  const liste = creerElement("ul", "liste-indices");
  valeurs.forEach(function (valeur) {
    liste.appendChild(creerElement("li", "", String(valeur)));
  });
  conteneur.appendChild(liste);
}

function afficherChoix(conteneur, choix) {
  if (!Array.isArray(choix) || choix.length === 0) {
    return;
  }
  conteneur.appendChild(creerElement("p", "", "Choix possibles :"));
  const liste = creerElement("ul", "liste-indices");
  choix.forEach(function (option) {
    const texte = typeof option === "string" ? option : option.texte;
    liste.appendChild(creerElement("li", "", texte));
  });
  conteneur.appendChild(liste);
}

function afficherExercice(exercice, dejaRendu, activerCorrection) {
  const details = creerElement("details", "exercice-bloc");
  const sommaire = creerElement(
    "summary",
    "",
    `${exercice.titre || "Exercice"} (${exercice.type || "exercice"})`
  );
  details.appendChild(sommaire);

  if (exercice.source) {
    details.appendChild(creerElement("p", "note-source", `Source : ${exercice.source}`));
  }
  if (exercice.statutCorrige) {
    details.appendChild(creerElement("p", "note-source", exercice.statutCorrige));
  }
  details.appendChild(creerElement("p", "", exercice.enonce || ""));
  ajouterListe(details, "Indices :", exercice.indices);
  afficherChoix(details, exercice.choix);

  const zoneSaisie = creerElement("div", "zone-saisie-td");
  const zoneRetour = creerElement("p", "message-local");
  const textarea = creerElement("textarea");
  textarea.rows = 8;
  textarea.placeholder = "Écris ou colle ici ta réponse…";
  textarea.disabled = dejaRendu;

  const bouton = creerElement("button", "btn", dejaRendu ? "Travail envoyé" : "Envoyer mon travail");
  bouton.type = "button";
  bouton.disabled = dejaRendu;

  bouton.addEventListener("click", async function () {
    const contenu = textarea.value.trim();
    if (!contenu) {
      zoneRetour.textContent = "Écris d'abord une réponse.";
      return;
    }
    bouton.disabled = true;
    bouton.textContent = "Envoi en cours…";
    try {
      const reponse = await fetch(
        `/api/td/${encodeURIComponent(matiereSlug)}/${encodeURIComponent(moduleSlug)}/rendu`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ exerciceRef: exercice.ref, contenu }),
        }
      );
      await lireReponse(reponse);
      textarea.disabled = true;
      bouton.textContent = "Travail envoyé";
      zoneRetour.textContent = "Travail enregistré. Tu peux voir la correction.";
      activerCorrection();
    } catch (erreur) {
      zoneRetour.textContent = erreur.message;
      bouton.disabled = false;
      bouton.textContent = "Envoyer mon travail";
    }
  });

  zoneSaisie.appendChild(textarea);
  zoneSaisie.appendChild(bouton);
  details.appendChild(zoneSaisie);
  details.appendChild(zoneRetour);
  return details;
}

function afficherCorrection(corrections) {
  zoneCorrection.replaceChildren();
  zoneCorrection.hidden = false;
  zoneCorrection.appendChild(creerElement("h2", "", "Correction du support"));
  zoneCorrection.appendChild(
    creerElement(
      "p",
      "note-source",
      "Correction fournie dans le support de cours. Aucune note n'est attribuée automatiquement."
    )
  );

  corrections.forEach(function (correction) {
    const article = creerElement("article", "correction-ligne");
    article.appendChild(creerElement("h3", "", correction.titre || "Exercice"));
    if (correction.solution) {
      const pre = creerElement("pre", "extrait-code");
      pre.appendChild(creerElement("code", "", correction.solution));
      article.appendChild(pre);
    }
    if (correction.explication) {
      article.appendChild(
        creerElement("p", "", `Explication : ${correction.explication}`)
      );
    }
    if (correction.attention) {
      article.appendChild(creerElement("p", "", `Attention : ${correction.attention}`));
    }
    zoneCorrection.appendChild(article);
  });
}

async function chargerTD() {
  if (!matiereSlug || !moduleSlug) {
    afficherMessage("Module non précisé dans l'adresse.");
    return;
  }
  zoneSousTitre.textContent = "Chargement du TD…";
  try {
    const reponse = await fetch(
      `/api/td/${encodeURIComponent(matiereSlug)}/${encodeURIComponent(moduleSlug)}`,
      { headers: { Accept: "application/json" } }
    );
    const donnees = await lireReponse(reponse);

    zoneTitre.textContent = donnees.moduleTitre || "Travaux dirigés";
    zoneSousTitre.textContent = donnees.titre || "";
    afficherMessage("");
    listeExercices.replaceChildren();
    zoneCorrection.replaceChildren();
    zoneCorrection.hidden = true;

    const boutonCorrection = creerElement(
      "button",
      "btn",
      "Voir la correction du support"
    );
    boutonCorrection.type = "button";
    boutonCorrection.hidden = !donnees.aRendu;
    boutonCorrection.addEventListener("click", async function () {
      boutonCorrection.disabled = true;
      try {
        const reponseCorrection = await fetch(
          `/api/td/${encodeURIComponent(matiereSlug)}/${encodeURIComponent(moduleSlug)}/correction`,
          { headers: { Accept: "application/json" } }
        );
        const resultat = await lireReponse(reponseCorrection);
        afficherCorrection(resultat.exercices);
      } catch (erreur) {
        afficherMessage(erreur.message);
      } finally {
        boutonCorrection.disabled = false;
      }
    });

    const exercicesRendus = new Set(
      Array.isArray(donnees.rendus) ? donnees.rendus : []
    );
    donnees.exercices.forEach(function (exercice) {
      listeExercices.appendChild(
        afficherExercice(exercice, exercicesRendus.has(exercice.ref), function () {
          exercicesRendus.add(exercice.ref);
          boutonCorrection.hidden = false;
        })
      );
    });
    listeExercices.appendChild(boutonCorrection);
  } catch (erreur) {
    if (erreur.message !== "Connexion requise") {
      afficherMessage(erreur.message, erreur.donnees && erreur.donnees.offres);
    }
  }
}

chargerTD();
