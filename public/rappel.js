/*
 * rappel.js
 * Affiche les fiches de rappel. La page ne contient aucun cours : on demande
 * d'abord la liste à /api/rappels, puis le texte d'une fiche à /api/rappels/:id
 * quand l'étudiant ouvre cette fiche (chargement à la demande, utile sur mobile).
 *
 * Le serveur seul décide de l'accès. Quand il répond 403, on affiche son message
 * et ses offres : le front ne fait que refléter cette réponse, il ne tente pas
 * de deviner lui-même si l'étudiant a le droit.
 */

const listeRappels = document.getElementById("liste-rappels");
const messageRappels = document.getElementById("message-rappels");

// Les fiches déjà chargées : on ne refait pas la même requête à chaque clic.
const fichesChargees = new Set();

// Petit fabriqueur d'élément pour éviter de répéter document.createElement.
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

// Affiche la liste des offres renvoyées par le serveur quand l'accès est refusé.
function afficherOffres(conteneur, offres) {
  if (!Array.isArray(offres) || offres.length === 0) {
    return;
  }
  conteneur.appendChild(creerElement("p", "", "Offres qui donnent accès à ce cours :"));
  const liste = creerElement("ul");
  offres.forEach(function (offre) {
    liste.appendChild(
      creerElement(
        "li",
        "",
        `${offre.nom} — ${offre.prix_fcfa} F / mois`
      )
    );
  });
  conteneur.appendChild(liste);
}

/*
 * Charge le contenu d'une fiche. "zone" est le <div class="rappel"> intérieur,
 * exactement comme dans l'ancien HTML statique : les règles CSS restent donc
 * inchangées.
 */
async function chargerFiche(rappel, zone) {
  if (fichesChargees.has(rappel.id)) {
    return;
  }
  fichesChargees.add(rappel.id);
  zone.appendChild(creerElement("p", "", "Chargement du cours…"));

  try {
    const reponse = await fetch(`/api/rappels/${rappel.id}`, {
      headers: { Accept: "application/json" },
    });
    const resultat = await reponse.json();
    zone.replaceChildren();

    if (!reponse.ok) {
      // 403 : pas de contenu envoyé par le serveur, seulement ce message.
      zone.appendChild(
        creerElement("p", "message-erreur", resultat.erreur || "Accès refusé.")
      );
      afficherOffres(zone, resultat.offres);
      return;
    }

    /*
     * innerHTML est volontairement utilisé ici, et seulement ici : le cours est
     * du HTML riche (tableaux, exemples de code) enregistré par l'import de
     * contenu. Il ne vient pas d'un champ saisi par un étudiant.
     */
    const cours = creerElement("div");
    cours.innerHTML = resultat.contenuHtml;
    zone.replaceChildren(cours);
  } catch (erreur) {
    zone.replaceChildren(
      creerElement("p", "message-erreur", "Le serveur est indisponible.")
    );
  }
}

// Construit une fiche repliable avec la même structure que l'ancien HTML.
function creerFiche(rappel) {
  const bloc = creerElement("div", "rappel");
  bloc.appendChild(creerElement("h4", "", rappel.matiere));

  const details = creerElement("details");
  details.id = `rappel-${rappel.moduleSlug}`;
  details.appendChild(creerElement("summary", "", rappel.titre));

  const zone = creerElement("div", "rappel");
  if (!rappel.accessible) {
    // On affiche tout de suite le motif renvoyé par la liste du serveur.
    zone.appendChild(
      creerElement("p", "message-erreur", rappel.raison || "Accès refusé.")
    );
  }
  details.appendChild(zone);

  // Le <details> est natif : pas besoin de librairie pour ouvrir/fermer.
  details.addEventListener("toggle", function () {
    if (details.open) {
      chargerFiche(rappel, zone);
    }
  });

  bloc.appendChild(details);
  return bloc;
}

async function chargerListe() {
  if (!listeRappels) {
    return;
  }

  try {
    const reponse = await fetch("/api/rappels", {
      headers: { Accept: "application/json" },
    });
    const resultat = await reponse.json();

    if (!reponse.ok) {
      messageRappels.textContent =
        resultat.erreur || "Impossible de charger les rappels.";
      return;
    }

    messageRappels.textContent = "";
    listeRappels.replaceChildren();
    resultat.rappels.forEach(function (rappel) {
      listeRappels.appendChild(creerFiche(rappel));
    });
  } catch (erreur) {
    messageRappels.textContent = "Le serveur est indisponible.";
  }
}

chargerListe();
