/*
 * revision.js
 * Remplit les états des modules de revision.html à partir de /api/modules-etats.
 *
 * Le HTML garde ses cartes et ses lignes : ce script ne change que les badges et
 * les attributs "disabled". Ainsi le design reste identique, et si l'API ne
 * répond pas, la page reste lisible avec ses états d'origine.
 *
 * "etat" vient de l'abonnement (disponible / verrouille) et "debloque" vient de
 * la progression (quiz du module précédent validé). Un bouton n'est actif que
 * si les deux sont vrais ; la page de quiz ou de TD vérifiera encore l'accès
 * côté serveur avant d'envoyer quoi que ce soit.
 */

// Traduction entre la valeur de l'API et le texte du badge.
const LIBELLES_ETAT = {
  disponible: "Disponible",
  verrouille: "Verrouillé",
};

async function appliquerEtatsModules() {
  try {
    const reponse = await fetch("/api/modules-etats", {
      headers: { Accept: "application/json" },
    });
    if (!reponse.ok) {
      return; // On garde le HTML tel quel si le serveur refuse la requête.
    }
    const resultat = await reponse.json();

    // Clé = matière + module. Les deux slugs viennent des attributs data-...
    const etats = new Map();
    resultat.modules.forEach(function (module) {
      etats.set(`${module.matiereSlug}|${module.moduleSlug}`, module);
    });

    document.querySelectorAll("article[data-matiere-id]").forEach(function (carte) {
      const matiereSlug = carte.dataset.matiereId;

      carte.querySelectorAll("li.module-ligne[data-module-id]").forEach(function (ligne) {
        const etat = etats.get(`${matiereSlug}|${ligne.dataset.moduleId}`);
        if (!etat) {
          return; // Module inconnu de l'API : on ne touche à rien.
        }

        // L'ancien badge "Réussi" était une maquette : le meilleur score est
        // maintenant renvoyé par l'API, mais on garde le badge abonnement pour
        // ne pas casser le design existant.
        ligne.dataset.etat = etat.etat;

        const badge = ligne.querySelector(".etat-badge");
        if (badge) {
          badge.className = `etat-badge etat-badge--${etat.etat}`;
          badge.textContent = LIBELLES_ETAT[etat.etat];
        }

        ligne.querySelectorAll("button.action-btn").forEach(function (bouton) {
          // Un bouton "TD à venir" reste désactivé : son gabarit est vide et non
          // publié, c'est indépendant de l'abonnement.
          if (!bouton.dataset.etatInitial) {
            bouton.dataset.etatInitial = bouton.dataset.etat || "";
          }
          const aVenir = bouton.dataset.etatInitial === "a-venir";
          const accessible =
            etat.etat === "disponible" && etat.debloque !== false;
          bouton.dataset.etat = aVenir ? "a-venir" : etat.etat;
          bouton.disabled = aVenir || !accessible;
          bouton.title = accessible
            ? ""
            : etat.progressionRaison || "Module non accessible avec votre offre.";

          // Le bouton ouvre maintenant la vraie page : quiz.html ou td.html.
          if (bouton.dataset.type === "quiz" || bouton.dataset.type === "td") {
            bouton.addEventListener("click", function () {
              const page = bouton.dataset.type === "quiz" ? "quiz.html" : "td.html";
              const matiere = encodeURIComponent(
                bouton.dataset.matiere || matiereSlug
              );
              const module = encodeURIComponent(
                bouton.dataset.module || ligne.dataset.moduleId
              );
              window.location.href = `${page}?matiere=${matiere}&module=${module}`;
            });
          }
        });
      });
    });
  } catch (erreur) {
    // Serveur indisponible : le HTML statique reste affiché, sans erreur visible.
  }
}

appliquerEtatsModules();
