/*
 * espace-etudiant.js
 * Remplit le panneau « Mon abonnement » avec la réponse de /api/mon-abonnement.
 *
 * Le navigateur ne calcule rien : l'offre, la date de fin et les jours restants
 * viennent du serveur. C'est important car la date de fin doit être la même pour
 * tout le monde, même si l'horloge du téléphone est fausse.
 */

const zoneAbonnement = document.getElementById("abonnement-contenu");

function creerParagraphe(texte) {
  const element = document.createElement("p");
  element.textContent = texte;
  return element;
}

// "2026-12-15 10:30:00" -> "15/12/2026" en français.
function formaterDate(texteDate) {
  if (!texteDate) {
    return "date inconnue";
  }
  const date = new Date(texteDate.replace(" ", "T") + "Z");
  return date.toLocaleDateString("fr-FR");
}

async function chargerMonAbonnement() {
  if (!zoneAbonnement) {
    return;
  }

  try {
    const reponse = await fetch("/api/mon-abonnement", {
      headers: { Accept: "application/json" },
    });
    const resultat = await reponse.json();

    if (!reponse.ok) {
      // 401/403 : le serveur a déjà décidé, on affiche simplement son message.
      zoneAbonnement.replaceChildren(
        creerParagraphe(resultat.erreur || "Abonnement indisponible.")
      );
      return;
    }

    zoneAbonnement.replaceChildren();
    const abonnement = resultat.abonnement;

    if (!abonnement) {
      zoneAbonnement.appendChild(creerParagraphe("Aucun abonnement actif."));
      if (Array.isArray(resultat.offres) && resultat.offres.length > 0) {
        zoneAbonnement.appendChild(
          creerParagraphe(
            "Offres disponibles : " +
              resultat.offres.map(function (offre) {
                return `${offre.nom} (${offre.prix_fcfa} F)`;
              }).join(", ") +
              "."
          )
        );
      }
      return;
    }

    const titre = document.createElement("h3");
    titre.textContent = abonnement.offreNom;
    zoneAbonnement.appendChild(titre);
    zoneAbonnement.appendChild(
      creerParagraphe(`Valable jusqu'au ${formaterDate(abonnement.dateFin)}.`)
    );
    zoneAbonnement.appendChild(
      creerParagraphe(`Jours restants : ${abonnement.joursRestants}.`)
    );
    if (abonnement.referencePaiement) {
      zoneAbonnement.appendChild(
        creerParagraphe(`Référence Wave : ${abonnement.referencePaiement}`)
      );
    }
  } catch (erreur) {
    zoneAbonnement.replaceChildren(
      creerParagraphe("Le serveur est indisponible.")
    );
  }
}

chargerMonAbonnement();
