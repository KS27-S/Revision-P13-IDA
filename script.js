/*
 * script.js
 * Fichier JavaScript commun chargé par toutes les pages HTML (attribut defer).
 *
 * Pourquoi ce fichier existe : l'en-tête et le pied de page étaient recopiés à
 * l'identique dans chaque page. Quand on corrige un lien, on devait modifier
 * sept fichiers. On les génère donc une seule fois, ici, à partir de petites
 * fonctions. Le HTML ne garde que deux conteneurs vides (site-header et
 * site-footer) : le JavaScript vient les remplir quand la page s'ouvre.
 */

// Liste unique des entrées du menu. Pourquoi un tableau : c'est la "source de
// vérité". Ajouter une page ici suffit à la faire apparaître partout.
let LIENS_NAVIGATION = [
  { page: "accueil.html", libelle: "Accueil" },
  { page: "revision.html", libelle: "Révision" },
  { page: "assistant.html", libelle: "Assistant de révision" },
  { page: "rappel.html", libelle: "Rappel de cours" },
  { page: "projet.html", libelle: "Projet" },
  { page: "espace-etudiant.html", libelle: "Espace étudiant" },
];

/*
 * Petite fonction utilitaire : retrouver le nom du fichier ouvert.
 * Pourquoi : pour comparer ce nom avec les pages de la liste ci-dessus et
 * savoir quel lien doit être mis en évidence. window.location.pathname donne
 * le chemin complet ; on ne garde que la dernière partie après le "/".
 */
function recupererPageCourante() {
  let morceaux = window.location.pathname.split("/");
  let nomFichier = morceaux[morceaux.length - 1];
  if (!nomFichier) {
    // Si aucune page n'est indiquée dans l'adresse, on considère qu'on est sur l'accueil.
    nomFichier = "accueil.html";
  }
  return nomFichier;
}

/*
 * Fonction 1 : construire la barre de navigation.
 * Elle crée le logo, le bouton burger (masqué sur ordinateur par le CSS) et
 * la liste des liens, puis Place le tout dans <header id="site-header">.
 */
function creerNavigation() {
  let emplacement = document.getElementById("site-header");
  // Pourquoi cette vérification : si une page oublie le conteneur, on ne doit
  // pas provoquer d'erreur JavaScript qui empêcherait le reste de la page.
  if (!emplacement) {
    return;
  }

  let pageCourante = recupererPageCourante();

  // On recrée la balise <nav> pour garder exactement le même CSS qu'avant.
  let barre = document.createElement("nav");

  // Le logo UNCHK reste à gauche, avec ses classes et son identifiant d'origine.
  let logo = document.createElement("img");
  logo.src = "image/logo UNCHK.png";
  logo.className = "logo-unchk";
  logo.id = "logo-unchk";
  logo.alt = "logo unchk";

  // Le burger est un vrai bouton : il est utilisable au clavier et annonce son
  // état aux lecteurs d'écran grâce à aria-expanded. Les trois <span> sont les
  // trois barres dessinées en CSS (aucune image ni librairie nécessaire).
  let boutonBurger = document.createElement("button");
  boutonBurger.type = "button";
  boutonBurger.className = "menu-burger";
  boutonBurger.setAttribute("aria-label", "Ouvrir le menu de navigation");
  boutonBurger.setAttribute("aria-expanded", "false");
  boutonBurger.setAttribute("aria-controls", "menu-principal");
  boutonBurger.innerHTML = "<span></span><span></span><span></span>";

  // La liste des liens est construite à partir du tableau unique défini plus haut.
  let liste = document.createElement("ul");
  liste.id = "menu-principal";
  liste.className = "menu-liens";

  LIENS_NAVIGATION.forEach(function (lien) {
    let elementListe = document.createElement("li");
    let ancre = document.createElement("a");
    ancre.href = lien.page;
    ancre.textContent = lien.libelle;

    // Pourquoi "actif" : c'est cette classe que le CSS utilise pour montrer
    // la page en cours. aria-current donne la même information aux lecteurs d'écran.
    if (lien.page === pageCourante) {
      ancre.className = "actif";
      ancre.setAttribute("aria-current", "page");
    }

    elementListe.appendChild(ancre);
    liste.appendChild(elementListe);
  });

  barre.appendChild(logo);
  barre.appendChild(boutonBurger);
  barre.appendChild(liste);
  emplacement.appendChild(barre);

  // Le clic ajoute ou retire "menu-ouvert" sur <nav> : le CSS se charge
  // ensuite d'afficher ou de masquer la liste sur les petits écrans.
  boutonBurger.addEventListener("click", function () {
    let menuOuvert = barre.classList.toggle("menu-ouvert");
    boutonBurger.setAttribute("aria-expanded", menuOuvert ? "true" : "false");
    boutonBurger.setAttribute(
      "aria-label",
      menuOuvert
        ? "Fermer le menu de navigation"
        : "Ouvrir le menu de navigation"
    );
  });
}

/*
 * Fonction 2 : construire le pied de page.
 * Même principe que pour la navigation : une seule définition du logo, de la
 * mention de copyright et du lien vers les conditions d'utilisation.
 */
function creerPiedDePage() {
  let emplacement = document.getElementById("site-footer");
  if (!emplacement) {
    return;
  }

  let logo = document.createElement("img");
  logo.src = "image/logo dijadev.png";
  logo.alt = "logo dijadev";
  logo.className = "logo-dijadev";
  logo.id = "logo-dijadev";

  let texte = document.createElement("p");
  texte.appendChild(
    document.createTextNode("© 2026 Révision P13 IDA - Tous droits réservés. ")
  );

  let lienConditions = document.createElement("a");
  lienConditions.href = "index.html";
  lienConditions.textContent = "Conditions d'utilisation";

  // La page des conditions n'est pas dans le menu : on la signale ici quand même.
  if (recupererPageCourante() === "index.html") {
    lienConditions.className = "actif";
    lienConditions.setAttribute("aria-current", "page");
  }

  texte.appendChild(lienConditions);
  emplacement.appendChild(logo);
  emplacement.appendChild(texte);
}

/*
 * Démarrage : avec l'attribut defer, le HTML est déjà lu quand ce fichier
 * s'exécute. Le test sur readyState reste là pour que le script fonctionne
 * aussi s'il était chargé autrement (par exemple sans defer).
 */
function initialiserElementsPartages() {
  creerNavigation();
  creerPiedDePage();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiserElementsPartages);
} else {
  initialiserElementsPartages();
}
