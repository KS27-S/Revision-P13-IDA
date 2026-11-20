/*
 * auth.js
 * Gère les formulaires inscription, vérification du code et connexion.
 *
 * Pourquoi ce JavaScript séparé : script.js s'occupe du menu commun à toutes les
 * pages. Ici on ne traite que les pages de compte, pour garder chaque fichier
 * court et facile à lire.
 *
 * Les messages d'erreur affichés viennent du serveur, qui ne révèle jamais
 * d'information sensible (mot de passe, existence d'un numéro, etc.).
 */

// Retourne le formulaire s'il existe sur la page chargée.
function trouverFormulaire(id) {
  return document.getElementById(id);
}

function afficherMessage(id, texte, estErreur) {
  let element = document.getElementById(id);
  if (!element) {
    return;
  }
  element.textContent = texte;
  element.className = estErreur ? "message-erreur" : "message-succes";
  // role="alert" est posé dans le HTML : le lecteur d'écran annonce le message.
}

// Lecture d'une réponse JSON sans faire planter la page si le serveur répond
// autre chose (par exemple une page d'erreur HTML).
async function lireReponse(reponse) {
  try {
    return await reponse.json();
  } catch (erreur) {
    return { erreur: "Le serveur n'a pas répondu correctement." };
  }
}

async function inscrireEvenement(event) {
  event.preventDefault(); // empêche le rechargement de la page par le navigateur.

  const formulaire = trouverFormulaire("formulaire-inscription");
  const donnees = {
    pseudo: formulaire.elements.pseudo.value.trim(),
    whatsapp: formulaire.elements.whatsapp.value.trim(),
    mot_de_passe: formulaire.elements.mot_de_passe.value,
  };

  try {
    const reponse = await fetch("/api/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(donnees),
    });
    const resultat = await lireReponse(reponse);

    if (!reponse.ok) {
      const texte = resultat.erreurs
        ? resultat.erreurs.join(" ")
        : resultat.erreur || "Inscription impossible.";
      return afficherMessage("message-inscription", texte, true);
    }

    afficherMessage("message-inscription", resultat.message, false);

    // On mémorise le numéro pour la vérification et on affiche le champ code.
    window.numeroInscrit = donnees.whatsapp;
    const sectionCode = document.getElementById("section-code");
    if (sectionCode) {
      sectionCode.hidden = false;
    }
  } catch (erreur) {
    afficherMessage("message-inscription", "Le serveur est indisponible.", true);
  }
}

async function verifierCodeEvenement(event) {
  event.preventDefault();

  const formulaire = trouverFormulaire("formulaire-code");
  const donnees = {
    whatsapp: window.numeroInscrit || formulaire.elements.whatsapp.value.trim(),
    code: formulaire.elements.code.value.trim(),
  };

  try {
    const reponse = await fetch("/api/verifier-code", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(donnees),
    });
    const resultat = await lireReponse(reponse);
    afficherMessage(
      "message-code",
      resultat.message || resultat.erreur || "Vérification impossible.",
      !reponse.ok
    );
  } catch (erreur) {
    afficherMessage("message-code", "Le serveur est indisponible.", true);
  }
}

async function renvoyerCodeEvenement() {
  const formulaire = trouverFormulaire("formulaire-code");
  if (!formulaire) {
    return;
  }

  const donnees = {
    whatsapp: window.numeroInscrit || formulaire.elements.whatsapp.value.trim(),
  };

  try {
    const reponse = await fetch("/api/renvoyer-code", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(donnees),
    });
    const resultat = await lireReponse(reponse);
    afficherMessage(
      "message-code",
      resultat.message || resultat.erreur || "Envoi impossible.",
      !reponse.ok
    );
  } catch (erreur) {
    afficherMessage("message-code", "Le serveur est indisponible.", true);
  }
}

async function connecterEvenement(event) {
  event.preventDefault();

  const formulaire = trouverFormulaire("formulaire-connexion");
  const donnees = {
    whatsapp: formulaire.elements.whatsapp.value.trim(),
    mot_de_passe: formulaire.elements.mot_de_passe.value,
  };

  try {
    const reponse = await fetch("/api/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(donnees),
    });
    const resultat = await lireReponse(reponse);

    if (reponse.ok) {
      // Le cookie de session a été posé par le serveur : on peut entrer dans
      // l'espace étudiant.
      window.location.href = "espace-etudiant.html";
      return;
    }

    afficherMessage(
      "message-connexion",
      resultat.erreur || "Connexion impossible.",
      true
    );
  } catch (erreur) {
    afficherMessage("message-connexion", "Le serveur est indisponible.", true);
  }
}

// On n'ajoute un écouteur que si le formulaire est présent sur la page.
const formulaireInscription = trouverFormulaire("formulaire-inscription");
if (formulaireInscription) {
  formulaireInscription.addEventListener("submit", inscrireEvenement);
}

const formulaireCode = trouverFormulaire("formulaire-code");
if (formulaireCode) {
  formulaireCode.addEventListener("submit", verifierCodeEvenement);

  const boutonRenvoyer = document.getElementById("renvoyer-code");
  if (boutonRenvoyer) {
    boutonRenvoyer.addEventListener("click", renvoyerCodeEvenement);
  }
}

const formulaireConnexion = trouverFormulaire("formulaire-connexion");
if (formulaireConnexion) {
  formulaireConnexion.addEventListener("submit", connecterEvenement);
}

// Message affiché après une inscription réussie quand on revient sur la page.
if (window.location.search.includes("inscrit=1")) {
  afficherMessage(
    "message-inscription",
    "Inscription enregistrée. Consultez la console du serveur pour le code de vérification.",
    false
  );
}
