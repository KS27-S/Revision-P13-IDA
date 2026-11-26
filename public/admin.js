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

// ---------------------------------------------------------------------------
// Gestion des abonnements. Les données viennent toujours du serveur : le front
// n'a aucun droit pour décider d'un accès, il affiche seulement ce qu'on lui
// renvoie.
// ---------------------------------------------------------------------------

const corpsAbonnements = document.getElementById("corps-abonnements");
const formulaireAbonnement = document.getElementById("formulaire-abonnement");
const zoneMessageAbonnement = document.getElementById("message-abonnement");
const zoneExpirationProche = document.getElementById("expiration-proche");

function afficherMessageAbonnement(texte, estErreur) {
  if (!zoneMessageAbonnement) {
    return;
  }
  zoneMessageAbonnement.textContent = texte;
  zoneMessageAbonnement.className = estErreur ? "message-erreur" : "message-succes";
}

// Remplit une liste déroulante avec createElement : là encore, aucun innerHTML
// avec des données venant des utilisateurs.
function remplirSelect(select, elements, fabriquerLibelle) {
  if (!select) {
    return;
  }
  select.replaceChildren();
  elements.forEach(function (element) {
    const option = document.createElement("option");
    option.value = String(element.id);
    option.textContent = fabriquerLibelle(element);
    select.appendChild(option);
  });
}

async function chargerListesAbonnement() {
  try {
    const [reponseUtilisateurs, reponseOffres] = await Promise.all([
      fetch("/api/admin/utilisateurs-valides", {
        headers: { Accept: "application/json" },
      }),
      fetch("/api/admin/offres", { headers: { Accept: "application/json" } }),
    ]);

    if (
      verifierAccesRefuse(reponseUtilisateurs) ||
      verifierAccesRefuse(reponseOffres)
    ) {
      return;
    }

    const utilisateurs = await lireReponse(reponseUtilisateurs);
    const offres = await lireReponse(reponseOffres);
    if (!reponseUtilisateurs.ok || !reponseOffres.ok) {
      return afficherMessageAbonnement("Chargement impossible.", true);
    }

    remplirSelect(
      document.getElementById("abonnement-etudiant"),
      utilisateurs.utilisateurs,
      function (utilisateur) {
        return `${utilisateur.pseudo} — ${utilisateur.whatsapp}`;
      }
    );
    remplirSelect(
      document.getElementById("abonnement-offre"),
      offres.offres,
      function (offre) {
        return `${offre.nom} (${offre.prix_fcfa} F)`;
      }
    );
  } catch (erreur) {
    afficherMessageAbonnement("Le serveur est indisponible.", true);
  }
}

// Affiche l'historique complet (les lignes expirées comprises) et compte celles
// qui arrivent à échéance dans les 7 prochains jours.
async function chargerAbonnements() {
  if (!corpsAbonnements) {
    return;
  }

  try {
    const reponse = await fetch("/api/admin/abonnements", {
      headers: { Accept: "application/json" },
    });
    if (verifierAccesRefuse(reponse)) {
      return;
    }
    const resultat = await lireReponse(reponse);
    if (!reponse.ok) {
      return afficherMessageAbonnement(
        resultat.erreur || "Chargement impossible.",
        true
      );
    }

    corpsAbonnements.replaceChildren();
    let proches = 0;

    resultat.abonnements.forEach(function (abonnement) {
      if (abonnement.expireBientot) {
        proches += 1;
      }

      const ligne = document.createElement("tr");
      if (abonnement.expireBientot) {
        ligne.className = "proche-expiration";
      }

      const valeurs = [
        `${abonnement.pseudo} — ${abonnement.whatsapp}`,
        abonnement.offre_nom,
        abonnement.date_debut,
        abonnement.date_fin,
        `${abonnement.joursRestants} j`,
        abonnement.statut,
      ];
      valeurs.forEach(function (valeur) {
        const cellule = document.createElement("td");
        cellule.textContent = valeur;
        ligne.appendChild(cellule);
      });

      const celluleAction = document.createElement("td");
      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "btn btn-valider";
      bouton.textContent = "Prolonger";
      bouton.dataset.action = "prolonger";
      bouton.dataset.id = abonnement.id;
      celluleAction.appendChild(bouton);
      ligne.appendChild(celluleAction);

      corpsAbonnements.appendChild(ligne);
    });

    if (zoneExpirationProche) {
      zoneExpirationProche.textContent =
        proches > 0
          ? `${proches} abonnement(s) actif(s) expirent dans les 7 prochains jours.`
          : "Aucun abonnement actif n'expire dans les 7 prochains jours.";
    }
  } catch (erreur) {
    afficherMessageAbonnement("Le serveur est indisponible.", true);
  }
}

async function activerAbonnement(event) {
  event.preventDefault();
  if (!formulaireAbonnement) {
    return;
  }

  const donnees = new FormData(formulaireAbonnement);
  const corps = {
    utilisateurId: donnees.get("utilisateurId"),
    offreId: donnees.get("offreId"),
    dureeMois: donnees.get("dureeMois"),
    referencePaiement: donnees.get("referencePaiement"),
  };

  try {
    const reponse = await fetch("/api/admin/abonnements", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(corps),
    });
    if (verifierAccesRefuse(reponse)) {
      return;
    }
    const resultat = await lireReponse(reponse);
    if (!reponse.ok) {
      return afficherMessageAbonnement(
        resultat.erreur || "Activation impossible.",
        true
      );
    }
    afficherMessageAbonnement(resultat.message, false);
    await chargerAbonnements();
  } catch (erreur) {
    afficherMessageAbonnement("Le serveur est indisponible.", true);
  }
}

async function prolongerAbonnement(event) {
  const bouton = event.target;
  if (!bouton.dataset || bouton.dataset.action !== "prolonger") {
    return;
  }

  // La durée est lue au moment du clic : l'admin peut la changer juste avant.
  const champDuree = document.getElementById("abonnement-duree");
  const corps = { dureeMois: champDuree ? champDuree.value : 1 };

  try {
    const reponse = await fetch(
      `/api/admin/abonnements/${bouton.dataset.id}/prolonger`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(corps),
      }
    );
    if (verifierAccesRefuse(reponse)) {
      return;
    }
    const resultat = await lireReponse(reponse);
    if (!reponse.ok) {
      return afficherMessageAbonnement(
        resultat.erreur || "Prolongation impossible.",
        true
      );
    }
    afficherMessageAbonnement(resultat.message, false);
    await chargerAbonnements();
  } catch (erreur) {
    afficherMessageAbonnement("Le serveur est indisponible.", true);
  }
}

if (corpsTableau) {
  corpsTableau.addEventListener("click", decider);
  chargerInscriptions();
}

if (corpsAbonnements) {
  corpsAbonnements.addEventListener("click", prolongerAbonnement);
  if (formulaireAbonnement) {
    formulaireAbonnement.addEventListener("submit", activerAbonnement);
  }
  chargerListesAbonnement();
  chargerAbonnements();
}

/*
 * Suivi des contenus. Le serveur envoie trois lignes par module (rappel, quiz,
 * TD) avec le statut, la validation et le verrou. Le front affiche ces valeurs
 * et envoie les ordres de publication ; c'est le serveur qui décide encore une
 * fois si la publication est autorisée.
 */
const corpsContenus = document.getElementById("corps-contenus");
const zoneMessageContenu = document.getElementById("message-contenu");
const zoneResumeContenu = document.getElementById("resume-contenu");
const boutonToutPublier = document.getElementById("bouton-tout-publier");

const LIBELLES_TYPES_CONTENU = {
  rappel: "Rappel",
  quiz: "Quiz",
  td: "TD",
};
const LIBELLES_STATUTS_CONTENU = {
  vide: "Vide",
  brouillon: "Brouillon",
  publie: "Publié",
};

function afficherMessageContenu(texte, estErreur) {
  if (!zoneMessageContenu) {
    return;
  }
  zoneMessageContenu.textContent = texte;
  zoneMessageContenu.className = estErreur ? "message-erreur" : "message-succes";
}

function creerCellule(texte, classe) {
  const cellule = document.createElement("td");
  cellule.textContent = texte;
  if (classe) {
    cellule.className = classe;
  }
  return cellule;
}

function creerBoutonContenu(libelle, action, contenu, estPrimaire) {
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = estPrimaire ? "btn btn-valider" : "btn btn-refuser";
  bouton.textContent = libelle;
  bouton.dataset.action = action;
  bouton.dataset.type = contenu.type;
  bouton.dataset.moduleId = contenu.moduleId;
  return bouton;
}

function rendreLigneContenu(contenu) {
  const ligne = document.createElement("tr");

  ligne.appendChild(creerCellule(contenu.matiereNom));
  ligne.appendChild(creerCellule(contenu.moduleTitre));
  ligne.appendChild(creerCellule(LIBELLES_TYPES_CONTENU[contenu.type] || contenu.type));

  const celluleStatut = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = `etat-badge etat-badge--${contenu.statut}`;
  badge.textContent = LIBELLES_STATUTS_CONTENU[contenu.statut] || contenu.statut;
  celluleStatut.appendChild(badge);
  ligne.appendChild(celluleStatut);

  const verification = contenu.complet ? "Complet et valide" : "Incomplet";
  ligne.appendChild(
    creerCellule(`${verification} — ${contenu.detail}${contenu.verrouille ? " — verrouillé" : ""}`)
  );

  const celluleAction = document.createElement("td");
  if (contenu.statut === "publie") {
    celluleAction.appendChild(
      creerBoutonContenu("Dépublier", "depublier", contenu, false)
    );
  } else {
    const boutonPublier = creerBoutonContenu("Publier", "publier", contenu, true);
    boutonPublier.disabled = !contenu.complet || contenu.verrouille;
    boutonPublier.title = contenu.verrouille
      ? "Déverrouillez d'abord ce contenu."
      : contenu.complet
        ? ""
        : "Contenu vide ou incomplet.";
    celluleAction.appendChild(boutonPublier);
  }
  celluleAction.appendChild(
    creerBoutonContenu(
      contenu.verrouille ? "Déverrouiller" : "Verrouiller",
      contenu.verrouille ? "deverrouiller" : "verrouiller",
      contenu,
      false
    )
  );
  ligne.appendChild(celluleAction);
  return ligne;
}

async function chargerContenus() {
  if (!corpsContenus) {
    return;
  }
  try {
    const reponse = await fetch("/api/admin/contenus", {
      headers: { Accept: "application/json" },
    });
    if (verifierAccesRefuse(reponse)) {
      return;
    }
    const resultat = await lireReponse(reponse);
    if (!reponse.ok) {
      return afficherMessageContenu(resultat.erreur || "Chargement impossible.", true);
    }
    corpsContenus.replaceChildren();
    resultat.contenus.forEach(function (contenu) {
      corpsContenus.appendChild(rendreLigneContenu(contenu));
    });
    if (zoneResumeContenu) {
      const resume = resultat.resume;
      zoneResumeContenu.textContent =
        `${resume.publie} publié(s), ${resume.brouillon} brouillon(s), ` +
        `${resume.vide} vide(s), ${resume.incomplet} incomplet(s).`;
    }
    afficherMessageContenu("", false);
  } catch (erreur) {
    afficherMessageContenu("Le serveur est indisponible.", true);
  }
}

async function agirSurContenu(bouton) {
  const action = bouton.dataset.action;
  const type = bouton.dataset.type;
  const moduleId = bouton.dataset.moduleId;
  if (!action || !type || !moduleId) {
    return;
  }
  try {
    const reponse = await fetch(
      `/api/admin/contenus/${encodeURIComponent(type)}/${encodeURIComponent(moduleId)}/${action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: "{}",
      }
    );
    if (verifierAccesRefuse(reponse)) {
      return;
    }
    const resultat = await lireReponse(reponse);
    if (!reponse.ok) {
      return afficherMessageContenu(resultat.erreur || "Action refusée.", true);
    }
    afficherMessageContenu("Action enregistrée.", false);
    await chargerContenus();
  } catch (erreur) {
    afficherMessageContenu("Le serveur est indisponible.", true);
  }
}

async function toutPublierContenus() {
  if (!boutonToutPublier) {
    return;
  }
  boutonToutPublier.disabled = true;
  try {
    const reponse = await fetch("/api/admin/contenus/tout-publier", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "{}",
    });
    if (verifierAccesRefuse(reponse)) {
      return;
    }
    const resultat = await lireReponse(reponse);
    if (!reponse.ok) {
      return afficherMessageContenu(resultat.erreur || "Publication impossible.", true);
    }
    afficherMessageContenu(
      `${resultat.publies} contenu(s) publié(s), ${resultat.ignores} ignoré(s).`,
      false
    );
    await chargerContenus();
  } catch (erreur) {
    afficherMessageContenu("Le serveur est indisponible.", true);
  } finally {
    boutonToutPublier.disabled = false;
  }
}

if (corpsContenus) {
  corpsContenus.addEventListener("click", function (evenement) {
    const bouton = evenement.target.closest("button[data-action]");
    if (bouton) {
      agirSurContenu(bouton);
    }
  });
  chargerContenus();
}

if (boutonToutPublier) {
  boutonToutPublier.addEventListener("click", toutPublierContenus);
}
