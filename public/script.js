/*
 * script.js
 * Fichier JavaScript commun chargé par toutes les pages HTML (attribut defer).
 *
 * Pourquoi ce fichier existe : l'en-tête et le pied de page étaient recopiés à
 * l'identique dans chaque page. Quand on corrige un lien, on devait modifier
 * sept fichiers. On les génère donc une seule fois, ici, à partir de petites
 * fonctions. Le HTML ne garde que deux conteneurs vides (site-header et
 * site-footer) : le JavaScript vient les remplir quand la page s'ouvre.
 *
 * Depuis l'arrivée du backend, ce script demande aussi à l'API si un utilisateur
 * est connecté. Le menu change alors : Connexion/Inscription si on est
 * déconnecté, pseudo et Déconnexion si on est connecté.
 */

// Liste unique des entrées du menu visibles par tout le monde. Pourquoi un
// tableau : c'est la "source de vérité". Ajouter une page ici suffit à la faire
// apparaître partout. L'ordre suit le parcours de l'étudiant : accueil, contenu
// de révision, outils d'aide, puis espace personnel et présentation du projet.
let LIENS_NAVIGATION = [
  { page: "accueil.html", libelle: "Accueil" },
  { page: "revision.html", libelle: "Révision" },
  { page: "rappel.html", libelle: "Rappel de cours" },
  { page: "assistant.html", libelle: "Assistant de révision" },
  { page: "espace-etudiant.html", libelle: "Espace étudiant" },
  { page: "projet.html", libelle: "Projet" },
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
 * Demande l'état de la session au serveur.
 * Pourquoi passer par l'API : le cookie est httpOnly, donc le JavaScript n'a pas
 * le droit de le lire. C'est le serveur qui nous dit qui est connecté.
 * Si le serveur ne répond pas (page ouverte en local sans Node), on considère
 * que le visiteur est déconnecté : le site reste lisible.
 */
async function recupererSession() {
  try {
    const reponse = await fetch("/api/session", {
      headers: { Accept: "application/json" },
    });
    if (!reponse.ok) {
      return { connecte: false };
    }
    return await reponse.json();
  } catch (erreur) {
    return { connecte: false };
  }
}

// Fabrique un <li><a> du menu. textContent (et non innerHTML) empêche
// qu'un pseudo contenant du HTML modifie la page. La classe facultative sert
// à distinguer certaines actions, comme le bouton "Inscription".
function creerLienMenu(page, libelle, pageCourante, classe = "") {
  let elementListe = document.createElement("li");
  let ancre = document.createElement("a");
  ancre.href = page;
  ancre.textContent = libelle;

  if (page === pageCourante) {
    ancre.className = "actif";
    ancre.setAttribute("aria-current", "page");
  }

  if (classe) {
    elementListe.className = classe;
  }

  elementListe.appendChild(ancre);
  return elementListe;
}

// Enveloppe un élément de session (pseudo, déconnexion) dans un <li> du menu.
function creerElementSession(enfant) {
  let elementListe = document.createElement("li");
  elementListe.appendChild(enfant);
  return elementListe;
}

// Appelé par le bouton "Déconnexion" du menu.
async function deconnecter() {
  try {
    const reponse = await fetch("/api/deconnexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (reponse.ok) {
      window.location.href = "accueil.html";
    }
  } catch (erreur) {
    console.error("Déconnexion impossible :", erreur);
  }
}

/*
 * Fonction 1 : construire la barre de navigation.
 * Elle crée le logo, le bouton burger (masqué sur ordinateur par le CSS) et
 * la liste des liens, puis place le tout dans <header id="site-header">.
 */
function creerNavigation(session) {
  let emplacement = document.getElementById("site-header");
  // Pourquoi cette vérification : si une page oublie le conteneur, on ne doit
  // pas provoquer d'erreur JavaScript qui empêcherait le reste de la page.
  if (!emplacement) {
    return;
  }

  let pageCourante = recupererPageCourante();

  // On recrée la balise <nav> pour garder le même sélecteur CSS qu'avant.
  let barre = document.createElement("nav");
  barre.setAttribute("aria-label", "Navigation principale");

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
    liste.appendChild(creerLienMenu(lien.page, lien.libelle, pageCourante));
  });

  // Liens qui dépendent de la session. Le serveur a déjà vérifié le cookie :
  // le front ne fait qu'afficher le résultat, il ne décide pas des droits.
  // On les rassemble d'abord dans un tableau : le CSS peut ainsi séparer la
  // zone "compte" du reste du menu grâce à la classe "session-debut".
  let elementsSession = [];

  if (session.connecte) {
    if (session.role === "admin") {
      elementsSession.push(
        creerLienMenu("admin.html", "Administration", pageCourante)
      );
    }

    let affichagePseudo = document.createElement("span");
    affichagePseudo.className = "menu-pseudo";
    affichagePseudo.textContent = session.pseudo;
    elementsSession.push(creerElementSession(affichagePseudo));

    let boutonDeconnexion = document.createElement("button");
    boutonDeconnexion.type = "button";
    boutonDeconnexion.className = "lien-menu";
    boutonDeconnexion.textContent = "Déconnexion";
    boutonDeconnexion.addEventListener("click", deconnecter);
    elementsSession.push(creerElementSession(boutonDeconnexion));
  } else {
    elementsSession.push(
      creerLienMenu("connexion.html", "Connexion", pageCourante, "lien-connexion")
    );
    elementsSession.push(
      creerLienMenu(
        "inscription.html",
        "Inscription",
        pageCourante,
        "lien-inscription"
      )
    );
  }

  elementsSession.forEach(function (element, index) {
    element.classList.add("element-session");
    if (index === 0) {
      element.classList.add("session-debut");
    }
    liste.appendChild(element);
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
 * Sur les pages protégées, le serveur bloque déjà l'accès. Cette vérification
 * côté navigateur sert seulement à éviter un affichage bref de la page avant
 * une redirection : elle n'est jamais une protection de sécurité.
 */
function protegerPages(session) {
  let page = recupererPageCourante();

  if (page === "espace-etudiant.html") {
    if (!session.connecte) {
      window.location.replace("connexion.html");
    } else if (session.statut && session.statut !== "valide") {
      window.location.replace("en-attente.html");
    }
  }

  if (page === "admin.html" && (!session.connecte || session.role !== "admin")) {
    window.location.replace("accueil.html");
  }
}

// Les boutons avec data-redirection remplacent les anciens attributs onclick :
// helmet interdit le JavaScript écrit directement dans le HTML.
function activerBoutonsRedirection() {
  document.querySelectorAll("[data-redirection]").forEach(function (bouton) {
    bouton.addEventListener("click", function () {
      window.location.href = bouton.dataset.redirection;
    });
  });
}

/*
 * Démarrage : avec l'attribut defer, le HTML est déjà lu quand ce fichier
 * s'exécute. Le test sur readyState reste là pour que le script fonctionne
 * aussi s'il était chargé autrement (par exemple sans defer).
 */
async function initialiserElementsPartages() {
  let session = await recupererSession();
  creerNavigation(session);
  creerPiedDePage();
  activerBoutonsRedirection();
  protegerPages(session);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiserElementsPartages);
} else {
  initialiserElementsPartages();
}
