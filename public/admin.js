/*
 * admin.js
 * Remplit le tableau des inscriptions en attente et traite les décisions.
 *
 * Pourquoi on crée les lignes avec createElement et textContent : un pseudo
 * vient d'un utilisateur. Avec innerHTML, un pseudo contenant du HTML pourrait
 * modifier la page (injection XSS). Ici il reste toujours du simple texte.
 */

const corpsTableau = document.getElementById("corps-tableau");
const zoneMessage = document.getElementById("message-admin");

function afficherMessage(texte, estErreur) {
  if (!zoneMessage) {
    return;
  }
  zoneMessage.textContent = texte;
  zoneMessage.className = estErreur ? "message-erreur" : "message-succes";
}

async function lireReponse(reponse) {
  try {
    return await reponse.json();
  } catch (erreur) {
    return { erreur: "Réponse inattendue du serveur." };
  }
}

// Le serveur est la vraie protection : si la session n'est pas admin, il
// renvoie 401 ou 403. Le front se contente de ramener l'utilisateur à l'accueil.
function verifierAccesRefuse(reponse) {
  if (reponse.status === 401) {
    window.location.replace("connexion.html");
    return true;
  }
  if (reponse.status === 403) {
    window.location.replace("accueil.html");
    return true;
  }
  return false;
}

function ajouterBouton(cellule, libelle, action, identifiant) {
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = action === "valider" ? "btn btn-valider" : "btn btn-refuser";
  bouton.textContent = libelle;
  bouton.dataset.action = action;
  bouton.dataset.id = identifiant;
  cellule.appendChild(bouton);
}

async function chargerInscriptions() {
  if (!corpsTableau) {
    return;
  }

  try {
    const reponse = await fetch("/api/admin/inscriptions?statut=en_attente", {
      headers: { Accept: "application/json" },
    });

    if (verifierAccesRefuse(reponse)) {
      return;
    }

    const resultat = await lireReponse(reponse);
    if (!reponse.ok) {
      return afficherMessage(resultat.erreur || "Chargement impossible.", true);
    }

    // On vide d'abord le tableau pour ne pas empiler les lignes à chaque appel.
    corpsTableau.replaceChildren();

    if (resultat.inscriptions.length === 0) {
      const ligne = document.createElement("tr");
      const cellule = document.createElement("td");
      cellule.colSpan = 5;
      cellule.textContent = "Aucune inscription en attente.";
      ligne.appendChild(cellule);
      corpsTableau.appendChild(ligne);
      return;
    }

    resultat.inscriptions.forEach(function (inscription) {
      const ligne = document.createElement("tr");

      const cellulePseudo = document.createElement("td");
      cellulePseudo.textContent = inscription.pseudo;
      ligne.appendChild(cellulePseudo);

      const celluleNumero = document.createElement("td");
      celluleNumero.textContent = inscription.whatsapp;
      ligne.appendChild(celluleNumero);

      const celluleDate = document.createElement("td");
      celluleDate.textContent = inscription.date_creation;
      ligne.appendChild(celluleDate);

      const celluleVerification = document.createElement("td");
      celluleVerification.textContent = inscription.numero_verifie
        ? "Vérifié"
        : "Non vérifié";
      ligne.appendChild(celluleVerification);

      const celluleActions = document.createElement("td");
      ajouterBouton(celluleActions, "Valider", "valider", inscription.id);
      ajouterBouton(celluleActions, "Refuser", "refuser", inscription.id);
      ligne.appendChild(celluleActions);

      corpsTableau.appendChild(ligne);
    });
  } catch (erreur) {
    afficherMessage("Le serveur est indisponible.", true);
  }
}

async function decider(event) {
  const bouton = event.target;
  if (!bouton.dataset || !bouton.dataset.action) {
    return;
  }

  const action = bouton.dataset.action;
  const id = bouton.dataset.id;
  const route = `/api/admin/inscriptions/${id}/${action}`;

  try {
    const reponse = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "{}",
    });

    if (verifierAccesRefuse(reponse)) {
      return;
    }

    const resultat = await lireReponse(reponse);
    if (!reponse.ok) {
      return afficherMessage(resultat.erreur || "Action impossible.", true);
    }

    afficherMessage("Décision enregistrée.", false);
    await chargerInscriptions();
  } catch (erreur) {
    afficherMessage("Le serveur est indisponible.", true);
  }
}

if (corpsTableau) {
  corpsTableau.addEventListener("click", decider);
  chargerInscriptions();
}
