# Relecture – Les 8 rappels de cours gratuits (premier module de chaque matière)

Brouillons rédigés par Claude à partir des supports de cours. À relire avant publication. Les rappels sont séparés par des lignes horizontales.



---

# Rappel de cours : Algorithme – Introduction à l'algorithmique

*Lecture : environ 10 minutes · brouillon rédigé par Claude à partir du support de cours : à relire avant publication*

## Objectifs

- Définir un algorithme et citer ses propriétés
- Distinguer un algorithme d'un programme
- Décrire les quatre phases d'élaboration d'un algorithme
- Déclarer des variables et des constantes avec leur type
- Utiliser l'affectation, Lire, Ecrire et les opérateurs
- Écrire et dérouler à la main un algorithme complet

## 1. La notion d'algorithme

Le mot vient du nom d'un mathématicien arabe du IXe siècle (écrit « El Khawrismi » dans le cours). Des mathématiciens grecs comme Euclide ou Archimède en sont des précurseurs : calcul du PGCD de deux nombres, calcul du nombre π.

Un ordinateur ne peut résoudre un problème que si on lui dit, de façon précise et détaillée, comment faire. Il faut donc décomposer la résolution en un nombre fini d'étapes élémentaires (par exemple additionner ou comparer deux nombres). Ce procédé de résolution s'appelle un **algorithme**.

**Définition.** Un algorithme est une suite de règles, de raisonnements ou d'opérations qui transforment des données d'entrée (input) en données de sortie (output).

**Exemple : Un algorithme du quotidien : trier un jeu de cartes par couleur**

Les algorithmes décrivent aussi des tâches de tous les jours. Ici, on sépare les cartes rouges des autres.

```
1. Prendre la première carte
2. La carte est-elle rouge ?
   Si oui, la poser sur le premier tas
   Sinon, la poser sur le second tas
3. Reste-t-il des cartes ?
   Si oui, prendre la carte suivante et continuer à l'étape 2
   Sinon, fin du tri
```


## 2. Propriétés d'un algorithme

Un algorithme doit être :

| Propriété | Ce que ça veut dire |
|---|---|
| Précis | Il indique l'ordre des étapes, quand arrêter une action, quand en commencer une autre, et comment choisir entre plusieurs possibilités. |
| Déterministe | Avec les mêmes données, une suite d'exécutions produit toujours les mêmes résultats. |
| Fini dans le temps | Il s'arrête au bout d'un temps fini. |

**Exemple : Résoudre A·X + B = 0**

Il faut prévoir tous les cas : si A est non nul, on divise ; si A est nul, il y a deux cas selon B. Un algorithme qui oublierait un de ces cas ne serait pas précis.

```
Lire A, B
Si A est non nul alors
   X ← -B / A
   Ecrire(X)
Sinon
   Si B est nul alors
      Ecrire("tout réel est solution")
   Sinon
      Ecrire("pas de solution")
   Finsi
Finsi
```


## 3. Règles pour concevoir un algorithme

| Règle | Explication |
|---|---|
| Entrée | On définit exactement les données auxquelles l'algorithme s'applique (l'ensemble peut être vide). |
| Sortie | Il produit une ou plusieurs données de sortie, reliées exactement aux données d'entrée. |
| Terminaison | Il se termine après un nombre fini de pas. |
| Clarté | Tous les détails et tous les cas sont prévus ; l'ordre des règles n'est jamais ambigu. |
| Efficacité | Chaque opération est assez simple, et le nombre d'opérations est fini et raisonnable. |

**Exemple : Pourquoi la clarté compte**

Quelqu'un indique un itinéraire à un étranger : « Tourner à droite au magasin, aller jusqu'au prochain croisement, puis prendre la troisième rue à gauche… ». À quel magasin tourner ? L'étranger peut poser la question, pas l'ordinateur. Chaque opération doit donc être définie de façon précise. Cette tâche s'appelle l'affinement progressif (ou conception descendante).


## 4. De l'algorithme au programme

Pour être exécuté par un ordinateur, un algorithme doit être exprimé dans un langage de programmation. Le **programme** est le codage d'un algorithme dans un langage donné.

Écrire le programme n'est qu'une étape du processus : problème réel → analyse → algorithme → codage (traduction) → programme → exécution → résultats.

| Type d'erreur | Signe | Que faire ? |
|---|---|---|
| Syntaxique | Signalée à l'exécution | Correction en général simple : retour au programme. |
| Sémantique | Aucun message, mais les résultats ne sont pas ceux attendus | Plus difficile à trouver : retour à l'analyse (à l'algorithme). |


## 5. Les quatre phases d'élaboration

| Phase | Rôle |
|---|---|
| 1. Analyse du problème | Bien comprendre l'énoncé. Il est inutile et dangereux de passer à la suite sans avoir bien discerné le problème. |
| 2. Solution en langage courant | Quelques lignes en français suffisent pour vérifier qu'on est sur la bonne voie. Elles serviront de support. |
| 3. Solution en pseudo-langage | Plusieurs solutions peuvent exister : on choisit la plus judicieuse et on reste cohérent jusqu'au bout. |
| 4. Tests et vérification | On vérifie que l'algorithme répond à toutes les demandes de l'énoncé. Sinon, retour à la phase 1. |


## 6. Types, variables et constantes

Un objet manipulé par un algorithme a un **type** : l'ensemble des valeurs qu'il peut prendre et les actions autorisées sur lui.

| Type | Valeurs |
|---|---|
| Entier | Un sous-ensemble des entiers relatifs ; chaque élément a un successeur et un prédécesseur. |
| Réel | Un sous-ensemble des réels décimaux signés ; pas de successeur ni de prédécesseur. |
| Caractère | Un caractère de la table ASCII. |
| Chaîne de caractères | Une suite de caractères. |
| Booléen | VRAI ou FAUX. |

Chaque objet est désigné par un **identificateur** : il commence par une lettre et ne contient pas d'espace. On choisit des noms explicites (prix_total plutôt que x) pour faciliter la relecture.

Une **variable** stocke provisoirement une valeur, qui peut changer. Il faut la **déclarer** avant de l'utiliser : lui donner un nom et un type. Une **constante** est un objet dont la valeur ne change jamais pendant l'algorithme.

**Exemple : Déclarations**

On déclare d'abord ses constantes, puis ses variables.

```
Constante
   PI = 3,14
Variable
   x : Entier
   v1, Y : Réel
   c : char
   S : chaine
   Ok : Booléen
```


## 7. Opérateurs et expressions

| Opérateur | Notation | Opérandes | Résultat |
|---|---|---|---|
| Multiplication | * | entier ou réel | entier ou réel |
| Division entière | DIV | entier | entier |
| Division | / | entier ou réel | réel |
| Reste (modulo) | MOD | entier | entier |
| Addition, soustraction | +  - | entier ou réel | entier ou réel |
| Comparaison | <  <=  >  >=  =  <> | tout type | booléen |
| ET, OU logiques | ET  OU | booléen | booléen |

**Exemple : DIV et MOD**

DIV donne le quotient de la division entière et MOD le reste. Avec 17 et 5 : 17 = 5 × 3 + 2.

```
17 DIV 5  →  3
17 MOD 5  →  2
7 / 2     →  3,5
```

Une **expression** est un ensemble de valeurs reliées par des opérateurs, équivalent à une seule valeur typée : 12+5 ou A+2. La multiplication est prioritaire sur l'addition : 2*3+5 vaut 11.


## 8. L'affectation

L'affectation attribue à un objet une valeur, résultat d'une évaluation. Le symbole est **←**. La valeur doit être compatible avec le type de l'objet à gauche.

**Exemple : Exemples d'affectations**

Si nb_kg est un entier et prix_du_kg un réel, le produit est un réel : prix_total doit donc être réel.

```
X ← 1                       X prend la valeur 1
X ← 2*3+5                   X prend la valeur 11
D ← D+1                     D augmente de 1
prix_total ← nb_kg * prix_du_kg
```

> ⚠️ **Attention.** Ne confonds pas « ← » (on donne une valeur) et « = » (on compare deux valeurs). Et l'ancienne valeur de la variable est perdue.

**Exemple : Échanger deux variables**

Avec A = 3 et B = 5, les deux instructions « A ← B puis B ← A » donnent A = 5 et B = 5 : la valeur 3 est perdue. Il faut une variable temporaire.

```
temp ← A
A ← B
B ← temp
```


## 9. Lecture et écriture

Pour dialoguer avec l'utilisateur, on utilise **Lire** (l'utilisateur saisit une valeur au clavier) et **Ecrire** (le programme affiche une valeur à l'écran).

**Exemple : Syntaxes**

Avant un Lire, on écrit un libellé pour dire à l'utilisateur quoi saisir.

```
Lire(nomVariable)
Lire(nomVariable1, nomVariable2)
Ecrire("chaine constante")
Ecrire("Chaine constante", prix_total)

Ecrire("saisir une valeur")
Lire(nomVariable)
```

Un **commentaire** est une suite de caractères placée entre les symboles % et %. Il n'est pas exécuté : il sert à documenter l'algorithme pour un lecteur. Exemple : (% ceci est un commentaire %).


## 10. Structure générale et exemple complet

**Exemple : Structure d'un algorithme**

Le nom, les déclarations (constantes, types, variables, sous-programmes), puis le corps entre Début et Fin.

```
Algorithme NomAlgorithme
   Constante   (% déclaration des constantes %)
   Type        (% création des types %)
   Variable    (% déclaration des variables %)
   (% définition des sous-programmes %)
Début
   Instructions
Fin
```

**Exemple : Exemple complet : la facture**

Cet algorithme demande le prix d'un kilogramme de choux et le nombre de kilogrammes, puis affiche le prix total.

```
ALGORITHME facture
VARIABLE
   prix_total, prix_du_kg : REEL
   nb_kg : ENTIER
DEBUT
   Ecrire("Entrez le prix d'un kilogramme de choux")
   Lire(prix_du_kg)
   Ecrire("Entrez le nombre de kilogrammes de choux : ")
   Lire(nb_kg)
   prix_total ← prix_du_kg * nb_kg
   Ecrire("Le prix total de l'achat est : ", prix_total)
FIN
```

**Exemple : Déroulement à la main**

Si l'utilisateur saisit 250 pour le prix et 3 pour le nombre de kilogrammes :

```
prix_du_kg = 250
nb_kg = 3
prix_total = 250 * 3 = 750
Affichage : Le prix total de l'achat est : 750
```

## À retenir

- Un algorithme est précis, déterministe et fini dans le temps.
- Un programme est le codage d'un algorithme dans un langage de programmation.
- Quatre phases : analyse, langage courant, pseudo-langage, tests (et retour à la phase 1 si besoin).
- Une erreur syntaxique se corrige dans le programme ; une erreur sémantique oblige à revenir à l'analyse.
- Toute variable se déclare avec un nom et un type ; une constante ne change jamais.
- DIV donne le quotient entier, MOD le reste, / donne un réel.
- ← affecte, = compare ; avant un Lire, on écrit un libellé avec Ecrire.

## Pièges fréquents

- A ← B puis B ← A écrase la valeur de A : utiliser une variable temporaire pour échanger.
- Oublier un cas (A nul dans A·X + B = 0) rend l'algorithme imprécis.
- Un nom de variable ne commence pas par un chiffre et ne contient pas d'espace.
- Multiplier un entier par un réel donne un réel : la variable qui reçoit le résultat doit être réelle.
- Un programme sans message d'erreur peut quand même donner des résultats faux (erreur sémantique).

## Pour s'entraîner

Le quiz et le TD de ce module (introduction) travaillent ces notions.


---

# Rappel de cours : Développement mobile – Introduction au génie logiciel mobile

*Lecture : environ 9 minutes · brouillon rédigé par Claude à partir du support de cours : à relire avant publication*

## Objectifs

- Situer le marché des smartphones et leurs systèmes d'exploitation
- Citer les contraintes matérielles et ergonomiques du développement mobile
- Définir l'expérience utilisateur (UX)
- Comparer les modes de monétisation d'une application
- Distinguer applications natives, web et hybrides
- Citer les tendances mobiles identifiées par Gartner

## 1. État de l'art des applications mobiles

Le cours (chiffres de fin 2014) donne l'ordre de grandeur du marché mobile :

| Indicateur | Valeur |
|---|---|
| Terminaux mobiles vendus fin 2014 | 6,9 milliards |
| Couverture de la population mondiale | environ 95 % |
| Utilisateurs de smartphones | 1,76 milliard (+23 % par rapport à 2013) |
| Données transférées | 395 millions de Go (+48 % par rapport à 2013) |
| Cartes SIM vendues en Tunisie | plus de 12,63 millions (taux de pénétration de 115 %) |
| Abonnés tunisiens ayant un smartphone | 12 % |

**D'où vient le smartphone ?** Le téléphone portable apparaît en 1983 (Motorola). Les assistants numériques personnels (PDA) apparaissent en 1990 : agenda, carnet d'adresses, bloc-notes et synchronisation des données avec un PC. Un **smartphone = téléphone portable + PDA** : c'est un mini-ordinateur portable sur lequel on télécharge des applications. Selon le cours, le premier est lancé en 2001 par Sagem, et l'essor date de 2005 avec la sortie de l'iPhone et le rachat d'Android par Google.

| Génération | Systèmes d'exploitation |
|---|---|
| Ancienne génération | Symbian (Nokia), Blackberry OS (RIM), Windows Mobile (Microsoft), Bada (Samsung) |
| OS tactiles | iOS (Apple), Android (Google), Windows Phone 7 (Microsoft) |

Le graphique du cours sur les parts de marché entre 2009 et 2016 montre un basculement net : Symbian pèse environ 47 % en 2009 et disparaît presque en 2016, alors qu'Android atteint environ 84,8 % en 2016 (iOS environ 14,4 %).


## 2. Contraintes matérielles et ergonomiques

Développer pour un mobile oblige à tenir compte des limites de l'appareil cible.

| Contrainte | Ce qu'il faut faire |
|---|---|
| Mémoire limitée, processeur lent | Éviter les traitements complexes et gourmands en mémoire, et bien cibler le public. Même si les hauts de gamme atteignent 3 Go de RAM, la plupart des smartphones ont un temps de chargement long. |
| Stockage limité | Certains modèles d'entrée de gamme n'ont que 4 Go (la majorité 16 Go) : s'orienter vers le stockage sur le cloud. |
| Autonomie | Éviter les applications gourmandes en énergie (la caméra vidéo pour la réalité augmentée, par exemple). |
| Écran réduit et variable | Exploiter l'espace de façon optimale avec le responsive design ; choisir des IHM qui facilitent la navigation (header fixe, icônes à la place des mots). |
| Clavier tactile | Minimiser les champs de texte, favoriser les champs préremplis, l'auto-complétion et la correction d'orthographe. |
| Clics invalides (« fat finger ») | Soigner la taille et la proximité des éléments cliquables ; prévoir un bouton « Annuler » un peu partout. |
| Pas d'effet de survol (hover) | Prévoir plus de liens et de boutons ; utiliser les conventions mobiles comme le balayage (swipe) ou la secousse (shake). |


## 3. L'expérience utilisateur (UX)

L'**expérience utilisateur** est le comportement, l'attitude et les émotions d'un utilisateur quand il manipule un produit, un système ou un service. Elle inclut les aspects pratiques, expérimentaux et affectifs de l'interaction homme-machine, et concerne l'utilité, la facilité d'utilisation et l'efficacité du produit.

C'est une notion **subjective** (elle dépend de la personne) et **dynamique** (elle évolue avec le changement des circonstances d'usage, des habitudes et des systèmes). Le cours invite à réfléchir aux situations d'usage du smartphone : partout, du lit au transport en commun, ce qui impose des interfaces simples.


## 4. Monétisation d'une application

Vendre l'application sur un store (App Store, Google Play) n'est pas la seule manière d'en tirer des revenus.

| Mode | À retenir |
|---|---|
| Application payante | Moyen classique. Les applications peu chères (moins d'un euro) ont un grand succès ; le prix varie selon l'OS (répercussion du coût de portage). Certains utilisateurs, surtout sur Android, sont réticents à payer. |
| Version d'essai | Version limitée qui donne une idée de la qualité ; bien adaptée aux jeux, mais pose un problème de maintenabilité pour les développeurs. |
| Publicité | Bandeau ou interstitiel ; rémunération en général au clic, donc revenu difficile à estimer ; peut altérer l'UX (lenteur, appui par erreur) et doit être bien ciblée. |
| Sponsoring | Inciter l'utilisateur à effectuer une action en échange d'un bien virtuel ; bien adapté aux jeux, car le public est bien ciblé. |
| Freemium | Proposer du contenu virtuel contre de l'argent : in-app purchase chez Apple, in-app billing chez Google. Possible dans une application payante ou gratuite. |

Pour réussir un freemium : l'application doit donner envie d'y revenir, le contenu virtuel doit valoir son prix, l'achat doit être simple et rapide (le moins de clics possible), et l'expérience gratuite doit rester limitée sans frustrer l'utilisateur.


## 5. Technologies mobiles : natif, web, hybride

| Catégorie | Principe | Avantages | Inconvénients |
|---|---|---|---|
| Native | Écrite dans le langage d'une plateforme (Objective C pour iOS, Java pour Android) | Performance, fiabilité, accès aux fonctions du téléphone (caméra, contacts), utilisable hors connexion, interface cohérente avec l'appareil | Développement coûteux ; code ni réutilisable ni portable entre plateformes |
| Web | Site adapté au mobile, accessible par le navigateur, sans installation (HTML, JavaScript, CSS) | Création rapide, coût bas, vraiment multiplateforme, modification à un seul endroit | Pas d'accès aux fonctions du téléphone, UX purement web, pas distribuée par les stores donc peu visible |
| Hybride | Développée en HTML, JavaScript, CSS puis enveloppée dans une application native, installable | Sans navigateur, développement raisonnable, accès aux fonctions du téléphone, publiable sur les stores | Accès un peu limité ; rendu pas toujours identique selon les navigateurs |


## 6. Tendances mobiles (étude Gartner citée par le cours)

Selon le cours, Internet mobile est devenu le moyen de communication privilégié entre les entreprises et leurs clients et collaborateurs. Dix tendances sont citées :

| N° | Tendance | Idée |
|---|---|---|
| 1 | Outils de développement multiplateformes | 3 OS (Android, iOS, Windows Phone) et 3 architectures (natif, hybride, web) : il faut maîtriser plusieurs outils |
| 2 | Langage HTML5 | Gagnera en importance pour les applications multiplateformes |
| 3 | Expérience utilisateur | Les mobinautes sont vite distraits : toujours maintenir leur attention |
| 4 | Géolocalisation | Contenu contextualisé, par exemple des promotions pour les mobinautes proches |
| 5 | Smartphones | Ils deviennent le centre (hub) du réseau personnel et dialoguent avec tous les gadgets |
| 6 | Nouvelles normes Wi-Fi | Performances multipliées par 3 ou 4 |
| 7 | Gestion des mobiles d'entreprise | Terminaux, applications, synchronisation, partage de fichiers |
| 8 | Internet of Things | En 2020, on vivra autour d'objets connectés |
| 9 | LTE et LTE-Advanced | Débits jusqu'à 1 Gbit/s : la 4G progresse vers le très haut débit |
| 10 | Outils de monitoring | Suivi des performances et du comportement des internautes |

> ⚠️ **Attention.** Ce cours date de 2018 et ses chiffres de 2014 à 2016 ne sont plus actuels : retiens surtout les idées (contraintes, UX, modes de monétisation, natif / web / hybride).

## À retenir

- Smartphone = téléphone portable + PDA ; Android et iOS dominent largement en 2016.
- Contraintes mobiles : mémoire, processeur, stockage, autonomie, écran réduit, clavier tactile, fat finger, pas de survol.
- L'UX est subjective (dépend de la personne) et dynamique (évolue dans le temps).
- Monétisation : payante, essai, publicité (au clic), sponsoring, freemium (in-app purchase chez Apple, in-app billing chez Google).
- Native = performante mais coûteuse ; web = rapide et peu coûteuse mais sans accès aux fonctions du téléphone ; hybride = web enveloppé dans une application native.
- Le responsive design adapte l'interface aux tailles d'écran variables.

## Pièges fréquents

- Ne pas confondre les 1,76 milliard d'utilisateurs de smartphones avec les 6,9 milliards de terminaux mobiles vendus.
- Le freemium s'appelle in-app purchase chez Apple mais in-app billing chez Google.
- L'absence de survol sur un écran tactile impose plus de liens et de boutons, pas moins.
- Une application web n'est pas distribuée par les stores : elle est peu visible.
- Une application hybride n'est pas une application native pure : son accès aux fonctions du téléphone reste un peu limité.

## Pour s'entraîner

Le quiz et le TD de ce module travaillent ces notions.


---

# Rappel de cours : Environnement mobile – Introduction aux technologies mobiles



## Objectifs

- Définir un environnement mobile
- Distinguer les App Stores les plus utilisés
- Dresser le panorama de l'écosystème mobile en 2016
- Expliquer les enjeux financiers de l'environnement mobile

## 1. Qu'est-ce qu'un environnement mobile ?

Un **environnement mobile** est l'ensemble des éléments qui entourent le mobile et qui contribuent à maintenir son écosystème. Un téléphone ne vit pas seul : il dépend de son système, de ses applications, de la façon dont on les crée et du marché qui les achète.

| Élément de l'environnement | Ce que ça recouvre |
|---|---|
| Périphériques mobiles | Smartphones, tablettes et autres appareils mobiles |
| Systèmes d'exploitation mobiles | Le logiciel qui fait fonctionner l'appareil (Android et iOS, par exemple) |
| Applications mobiles | Les logiciels conçus pour ces appareils |
| Approches de développement | Les façons de créer une application (natif, web, hybride…, vues dans les séquences suivantes) |
| Marché du mobile | Les acteurs, les investissements, les revenus |

> ⚠️ **Attention.** L'application n'est qu'un des cinq éléments : un environnement mobile est plus large qu'une simple application.


## 2. Applications mobiles et App Stores

Les **applications mobiles** sont des applications logicielles conçues pour fonctionner sur les smartphones, les tablettes et d'autres appareils mobiles. Elles sont disponibles par le biais de plateformes de distribution natives : typiquement des **App Stores** (magasins d'applications), exploités par les propriétaires du système d'exploitation mobile.

| Magasin | Exploité par |
|---|---|
| App Store | Apple (iOS) |
| Google Play | Google (Android) |
| Windows Phone Store | Microsoft (Windows Phone) |
| BlackBerry App World | BlackBerry (BlackBerry OS) |

**Exemple : Que faire pour toucher les utilisateurs d'iPhone et d'Android ?**

Chaque système a son magasin : un éditeur qui vise les deux publics doit publier sur l'App Store et sur Google Play.

Le cours note une évolution : la variété de solutions mobiles a favorisé des environnements fragmentés au départ, mais qui se résument de plus en plus à ceux qui tournent autour d'**Android** et d'**iOS**.


## 3. Les enjeux financiers (chiffres de 2016)

D'après un article du journal Le Monde cité dans le cours :

| Chiffre 2016 | Ce qu'il mesure |
|---|---|
| Plus de 90 milliards | Nouvelles applications téléchargées sur l'App Store et Google Play |
| 35 milliards de dollars (19 444 milliards de francs CFA) | Revenus rapportés aux éditeurs par les stores de Google et d'Apple (jeux, messageries, outils, sites d'information…) |

> ⚠️ **Attention.** Ne confonds pas ces deux chiffres : 90 milliards sont des téléchargements, 35 milliards sont des revenus en dollars.


## 4. Panorama de l'écosystème mobile en 2016

L'écosystème mobile se développe très vite et devient de plus en plus complexe à suivre : une multitude d'intervenants, de prestataires, de supports et d'outils analytiques. Le panorama du cours chiffre cet écosystème :

| Élément | Valeur 2016 |
|---|---|
| Sociétés | plus de 350 |
| Investissement | 28 milliards de dollars |
| Valorisation estimée | 405 milliards de dollars |

Le schéma du cours (« Mobile Foundations Landscape ») classe les acteurs en domaines. Nombre d'acteurs lus sur la diapo :

| Domaine | Acteurs |
|---|---|
| User Acquisition | 81 |
| Monetization | 78 |
| Development | 76 |
| User Engagement | 68 |
| Analytics | 62 |
| UX | 34 |
| Geolocation | 26 |
| API Layer | 21 |
| Attribution | 15 |
| Monitoring | 7 |

Un même acteur peut intervenir dans plusieurs domaines à la fois : c'est pourquoi la somme des acteurs des domaines dépasse 350.

## À retenir

- Un environnement mobile = périphériques, systèmes d'exploitation, applications, approches de développement et marché.
- Les applications sont distribuées par des App Stores exploités par les propriétaires de l'OS : App Store, Google Play, Windows Phone Store, BlackBerry App World.
- En 2016 : plus de 90 milliards de téléchargements et 35 milliards de dollars de revenus via l'App Store et Google Play.
- L'écosystème compte plus de 350 sociétés, 28 milliards de dollars d'investissement et 405 milliards de dollars de valorisation.
- Les environnements fragmentés au départ se résument de plus en plus à Android et iOS.

## Pièges fréquents

- Confondre téléchargements (90 milliards), revenus (35 milliards de dollars), investissement (28 milliards) et valorisation (405 milliards).
- Croire qu'un environnement mobile se limite aux applications.
- Oublier que chaque propriétaire d'OS exploite son propre magasin d'applications.

## Pour s'entraîner

Le quiz et le TD de ce module travaillent ces notions.


---

# Rappel de cours : HTML/CSS – Introduction à HTML et CSS

*Lecture : environ 8 minutes · brouillon rédigé par Claude à partir du support de cours : à relire avant publication*

## Objectifs

- Retracer l'historique de HTML et de CSS
- Définir les concepts de base liés à HTML
- Reconnaître la structure d'un document HTML
- Installer un éditeur et un serveur web local
- Lancer une page HTML depuis un navigateur

## 1. HTML et CSS : qui fait quoi ?

**HTML** (HyperText Markup Language) est le langage de balisage standard pour créer des pages web. Il décrit la **structure** des pages avec du balisage. Il permet de formater du texte, d'ajouter des graphiques, de créer des liens, des formulaires, des blocs, etc., et d'enregistrer le tout dans un fichier texte qu'un navigateur peut lire et afficher.

**CSS** (Cascading Style Sheets, feuilles de style en cascade) est un langage qui décrit la **présentation** des documents HTML et XML.

| Langage | Rôle |
|---|---|
| HTML | La structure et le contenu des pages |
| CSS | La présentation (couleurs, mise en page…) |


## 2. Un peu d'histoire

Selon le cours, Tim Berners-Lee, physicien du CERN, développe les protocoles du World Wide Web, puis crée le HTML. Ce langage est issu d'un sous-ensemble du SGML et s'appuie sur les travaux de Ted Nelson, à l'origine du terme **hypertexte** (1965).

En 1993, l'explosion d'Internet a lieu avec la sortie du navigateur (browser) **Mosaic** du NCSA. Les feuilles de style CSS sont développées par le **W3C** (World Wide Web Consortium), qui lance la version initiale le 17 décembre 1996. On est actuellement à la version 5 pour HTML et à la version 3 pour CSS.

| Version | Année |
|---|---|
| HTML | 1991 |
| HTML 2.0 | 1995 |
| HTML 3.2 | 1997 |
| HTML 4.01 | 1999 |
| XHTML | 2000 |
| HTML5 | 2014 |

> ⚠️ **Attention.** Les dates varient selon les sources : le cours d'Introduction au web place les travaux de Tim Berners-Lee vers 1990, celui-ci en 1992. Retiens surtout les noms et l'ordre des événements.


## 3. Structure d'un document HTML

**Exemple : Un premier document**

Voici la page minimale utilisée en TP.

```html
<!DOCTYPE html>
<html>
<head>
<title>Titre de la page</title>
</head>
<body>
<h1>Ma premiere entête</h1>
<p>Mon premier paragraphe.</p>
</body>
</html>
```

| Élément | Rôle |
|---|---|
| <!DOCTYPE html> | Déclare que le document est du HTML5 |
| <html> | Élément racine de la page |
| <head> | Contient des méta-informations sur le document |
| <title> | Spécifie le titre du document (affiché dans l'onglet) |
| <body> | Contient le contenu visible de la page |
| <h1> | Définit un gros titre |
| <p> | Définit un paragraphe |


## 4. Les balises HTML

Les balises HTML sont des noms d'éléments entourés de chevrons. Syntaxe : `<nomelement> le contenu </nomelement>`. Elles vont normalement par paire, comme `<b>` et `</b>` : la première est la **balise de début**, la seconde la **balise de fin**. La balise de fin s'écrit comme celle de début, avec une barre oblique avant le nom.

Un **document HTML** est un fichier d'extension `.htm` ou `.html`, qui contient des balises HTML et du texte brut. On l'appelle aussi une **page web**. Le but d'un navigateur est de lire ces documents et de les afficher : il **n'affiche pas les balises**, il les utilise pour interpréter le contenu.


## 5. La déclaration DOCTYPE

La déclaration `<!DOCTYPE>` représente le type de document et aide les navigateurs à afficher correctement les pages. Elle ne doit apparaître qu'**une seule fois**, tout en haut de la page, avant les balises HTML, et n'est **pas sensible à la casse**. Pour HTML5, c'est `<!DOCTYPE html>`.


## 6. Éditeurs, serveur et navigateur

| Outil | À retenir |
|---|---|
| Éditeurs professionnels | Dreamweaver, Visual Studio… Éditeurs WYSIWYG (« What You See Is What You Get ») : BlueGriffon, Dreamweaver. |
| Éditeurs simples | Notepad++, TextEdit (Mac), Sublime Text. Le cours recommande un simple éditeur de texte pour apprendre. |
| Serveur web local | XAMPP : un serveur web local (Apache), un serveur FTP et un serveur de messagerie. Libre, téléchargeable sur apachefriends.org. |
| Navigateur | Lit et affiche les documents HTML : Chrome, Firefox, Internet Explorer… |

Une page HTML créée en local peut être vue avec n'importe quel navigateur, sans serveur web. Mais travailler avec un serveur local vous rapproche de la réalité.


## 7. En pratique (TP 1)

**Exemple : Installer XAMPP et tester une page**

Les étapes du TP :

```html
1. Télécharger et installer XAMPP
2. Démarrer le serveur Apache
3. Créer un dossier « monsite » dans le dossier htdocs de XAMPP
4. Y placer la page exple1.html
5. Ouvrir http://localhost/monsite dans le navigateur
```

> ⚠️ **Attention.** Le TP écrit « c:\xampp\hdocs » : le dossier s'appelle htdocs.

## À retenir

- HTML décrit la structure des pages, CSS décrit leur présentation.
- Un document HTML est un fichier .html contenant du texte et des balises ; le navigateur interprète les balises sans les afficher.
- Structure minimale : DOCTYPE, html, head (avec title), body.
- Les balises vont par paire : la balise de fin porte une barre oblique avant le nom.
- DOCTYPE : une seule fois, en haut de page, pas sensible à la casse ; <!DOCTYPE html> pour HTML5.
- XAMPP donne un serveur web local ; on peut aussi tester sans serveur.

## Pièges fréquents

- Ne pas mettre le gros titre visible (h1) dans le head : il va dans le body.
- Le title du head n'est pas le gros titre de la page : c'est le titre affiché dans l'onglet.
- Oublier la barre oblique de la balise de fin.
- Confondre HTML (structure) et CSS (présentation).
- Croire qu'un serveur web est obligatoire pour afficher une page HTML locale.

## Pour s'entraîner

Le quiz et le TD de ce module travaillent ces notions.


---

# Rappel de cours : Initiation àla programmation – À la découverte de la programmation interactive (Scratch)



## Objectifs

- Installer le logiciel Scratch et reconnaître son interface
- Manipuler le langage Scratch
- Écrire des instructions élémentaires : mouvement, son, répétition, parole
- Gérer lutins, costumes, sons et arrière-plans

## 1. L'informatique créative

Ce cours est tiré du support officiel d'informatique créative de l'université de Harvard. L'informatique créative repose sur trois axes :

| Axe | Idée |
|---|---|
| Créativité | S'appuyer sur la créativité, l'imagination et les centres d'intérêt de l'apprenant pour l'aider à développer un lien personnel avec l'informatique. |
| Autonomisation | Mettre l'accent sur les compétences, les pratiques et les connaissances fondamentales dont les jeunes ont besoin pour créer les supports multimédias, dynamiques et interactifs qu'ils apprécient au quotidien. |
| Informatique | Préparer à bien plus qu'une carrière de programmeur : développer la pensée informatique, pour faire appel à ses concepts et à ses points de vue dans toutes les situations. |


## 2. Scratch, c'est quoi ?

**Scratch** est un langage de programmation libre et visuel, développé par des chercheurs du MIT. Il permet de créer facilement des animations, des histoires interactives, des jeux vidéo, des créations musicales et artistiques.

On l'installe en téléchargeant une version hors ligne depuis scratch.mit.edu/download (les fichiers sont aussi donnés dans le dossier Ressources du cours). Pour créer un nouveau projet, on clique sur **Créer** ; avec un compte Scratch, on se connecte pour sauvegarder son projet.

> ⚠️ **Attention.** Le cours dit que Scratch a été « créé en mai 2017 » : c'est erroné. Scratch 2.0 date de 2013, et Scratch 3 a remplacé Scratch 2 depuis 2019. Les notions de ce module (lutin, blocs, scripts, boucle) restent valables, mais l'interface a changé.


## 3. L'interface de Scratch

| Zone | Rôle |
|---|---|
| Palette de blocs | Les blocs de commande, rangés par catégories (mouvement, apparence, sons, événements…). On les fait glisser vers l'aire des scripts. |
| Aire des scripts | L'endroit où l'on assemble les blocs pour construire un programme. |
| Scène | L'espace où évolue le lutin ; on y voit le résultat du programme. |

Chaque objet de Scratch s'appelle un **lutin** (en anglais *sprite*). Au départ, c'est le chat. Un lutin peut avoir plusieurs **costumes**, et la scène peut avoir un **arrière-plan**.

Les blocs s'assemblent en **pile** : on les colle les uns sous les autres. On peut cliquer sur n'importe quel bloc pour lancer l'exécution de toute la pile. Pour déplacer une pile, on l'attrape par le bloc du dessus.


## 4. Pas à pas : « Pour bien commencer »

| Étape | Bloc ou action | Effet |
|---|---|---|
| 1. Lance-toi | AVANCER (catégorie Mouvement) | Le chat avance de 10 pas quand on clique sur le bloc |
| 2. Ajoute des sons | JOUER DU TAMBOUR | On l'accroche sous AVANCER et on choisit le tambour dans le menu |
| 3. Crée une danse | Un 2e AVANCER avec un signe moins devant le nombre | Le chat recule ; on ajoute un autre JOUER DU TAMBOUR |
| 4. Encore et encore | RÉPÉTER, placé sur le dessus de la pile | Sa « bouche » entoure les blocs à répéter ; on règle le nombre de fois |
| 5. Dis quelque chose | DIRE (catégorie Apparence) | Le lutin affiche un texte |
| 6. Le drapeau vert | Bloc « quand drapeau vert pressé » | Chaque clic sur le drapeau lance le script ; le bouton Stop l'arrête |
| 7. Change les couleurs | AJOUTER À L'EFFET | Modifie les couleurs du lutin |
| 8. Appuie sur une touche | Bloc « quand [espace] est pressé » | Le script se lance avec la touche choisie dans le menu |
| 9. Arrière-plan | Choisir un arrière-plan dans la bibliothèque (ex. Spotlight-stage) | Un nouveau décor apparaît sur la scène |
| 10. Ajoute un lutin | Bouton Nouveau lutin : bibliothèque, dessin, fichier ou photo (webcam) | Un nouveau personnage, déplaçable à la souris |
| 11. Découvre | Onglets Sons et Costumes | Importer un son (MP3, AIF ou WAV), changer de costume, animer en alternant les costumes |
| 12. Des conseils ! | Donner un nom au projet ; fenêtre Conseils | Exemples de scripts et explication de chaque bloc |


## 5. Notions à retenir pour programmer

**Exemple : Un script qui danse**

Voici, en texte, un programme construit avec les étapes 1 à 6 (un bloc par ligne, le retrait montre ce qui est dans la boucle). Le bloc DIRE est placé au-dessus de la pile.

```
quand drapeau vert pressé
dire « Bonjour ! »
répéter 10 fois      (nombre au choix)
   avancer de 10 pas
   jouer du tambour
   avancer de -10 pas
   jouer du tambour
```

**Commencer et finir un script.** Un script commence par un bloc de déclenchement (drapeau vert, touche pressée…). Les instructions s'exécutent dans l'ordre, de haut en bas. Le bloc RÉPÉTER permet d'éviter de recopier plusieurs fois les mêmes blocs.

**Animer un lutin.** On crée un script qui bascule entre ses costumes.

## À retenir

- Scratch est un langage de programmation libre et visuel, développé par des chercheurs du MIT.
- Trois zones : palette de blocs, aire des scripts, scène.
- Un objet s'appelle un lutin ; il peut avoir plusieurs costumes ; la scène a un arrière-plan.
- Les blocs s'assemblent en pile ; un clic sur un bloc exécute toute la pile.
- RÉPÉTER entoure les blocs à répéter ; le drapeau vert lance le script, Stop l'arrête.
- On importe des sons au format MP3, AIF ou WAV.

## Pièges fréquents

- Croire qu'un clic sur un bloc au milieu de la pile n'exécute que ce bloc : toute la pile s'exécute.
- Oublier de placer le bloc RÉPÉTER au-dessus des blocs à répéter (il doit les entourer).
- Penser que « AVANCER » ne peut aller que vers l'avant : un nombre négatif fait reculer.
- Attendre un son alors que le son de l'ordinateur est coupé.

## Pour s'entraîner

Le quiz et le TD de ce module travaillent ces notions.


---

# Rappel de cours : Réseau – Réseau informatique et Internet



## Objectifs

- Comprendre ce qu'est un réseau informatique
- Décrire les types de réseaux informatiques
- Définir Internet
- Retracer l'historique d'Internet
- Décrire les applications d'Internet les plus connues

## 1. Le cours d'Introduction au web

Ce cours est une introduction générale au Web, un prélude au cours d'Introduction aux langages HTML et CSS. Il fait un survol non exhaustif des concepts, technologies, langages et outils relatifs au World Wide Web. À la fin, l'apprenant doit avoir une compréhension claire du web et de son fonctionnement, un aperçu global des métiers du web, et pouvoir décrire les étapes de la création d'un site, de son implémentation à sa mise en ligne, en passant par les noms de domaine.


## 2. Qu'est-ce qu'un réseau informatique ?

Un **réseau** est un ensemble d'éléments informatiques (ordinateur, imprimante, hub, modem…) connectés les uns aux autres pour échanger des informations.

| Type de connexion | Exemple |
|---|---|
| Connexion physique (filaire) | Prise Ethernet |
| Connexion sans fil | Ondes radio, wifi |

Deux ordinateurs reliés entre eux constituent déjà un **mini-réseau**. On parle de **réseau local** pour désigner l'installation de ces périphériques dans un espace défini (maison, entreprise…). Ce réseau local peut être connecté à un réseau externe, comme Internet, par un **routeur** ou une **box**.

Un réseau informatique permet de partager des données, des documents, des applications et des imprimantes.


## 3. Qu'est-ce qu'Internet ?

Le terme « Internet », d'origine américaine, vient du concept d'*internetting* : **interconnecter des réseaux**.

**Définition.** Internet est le réseau informatique mondial qui rend accessibles au public des services comme le courrier électronique et le World Wide Web. Ses utilisateurs sont les **internautes**. Techniquement, Internet se définit comme le réseau public mondial utilisant le protocole de communication **IP** (Internet Protocol).

| Réseau | Caractéristique |
|---|---|
| Internet | Réseau public mondial |
| Intranet | Réseau privé au sein d'une entreprise, d'une administration… |
| Extranet | Interconnexion d'intranets, pouvant emprunter Internet |

La différence tient à la **confidentialité** des communications.


## 4. Historique d'Internet

| Idée clé | Ce que dit le cours |
|---|---|
| Un réseau « indestructible » | L'US Air Force demande à un petit groupe de chercheurs de créer un réseau de communication (ARPANET) qui résiste à une attaque nucléaire. Le concept repose sur un système décentralisé : si une ou plusieurs machines sont détruites, le réseau continue à fonctionner. Réseau purement militaire à l'origine. |
| La commutation de paquets | Dans les années 60 apparaissent les réseaux qui divisent les données en paquets, avec un en-tête pour le routage. Le premier est créé par Donald Davies au Royaume-Uni. |
| ARPANET | « Advanced Research Projects Agency Network », créé par le US Department of Defense. Premier réseau à utiliser TCP/IP, créé par Robert Kahn et Vint Cerf. |
| L'ouverture | De plus en plus d'universités se connectent. Les premiers fournisseurs d'accès émergent à la fin des années 80 : tout cela avant le web ! |

> ⚠️ **Attention.** Le cours donne des dates qui se contredisent (1962, octobre 1972 pour le mot internetting, 1977 pour ARPANET). Le cours de Réseau situe ARPANET en 1969. Retiens les idées (réseau décentralisé, commutation de paquets, TCP/IP) plutôt que ces dates.


## 5. Les applications d'Internet

Internet propose plusieurs applications. Les plus populaires :

| Application | Exemple d'usage |
|---|---|
| Le Web | Consulter des pages avec un navigateur |
| La messagerie électronique | Envoyer et recevoir du courrier |
| La messagerie instantanée | Discuter en direct |
| Le partage de fichiers poste à poste (P2P) | Échanger des fichiers entre utilisateurs |
| Le transfert de fichiers (FTP) | Envoyer des fichiers vers un serveur |

> ⚠️ **Attention.** Internet a été popularisé par l'apparition du World Wide Web : le public non averti confond parfois les deux. Le Web n'est qu'une application d'Internet.


## 6. Organismes cités en référence

| Organisme | Rôle |
|---|---|
| W3C (World Wide Web Consortium) | Standards du web |
| ICANN | Organisation qui coordonne les noms de domaine |
| AfriNIC | Registre régional d'adresses IP pour l'Afrique |
| NIC Sénégal | Comité de gestion des noms de domaine .SN |

## À retenir

- Un réseau relie des éléments informatiques (filaire ou sans fil) pour échanger des informations et partager des ressources.
- Un réseau local est connecté à Internet par un routeur ou une box.
- Internet = réseau public mondial utilisant le protocole IP ; ses utilisateurs sont les internautes.
- Intranet : réseau privé ; extranet : intranets interconnectés, pouvant emprunter Internet.
- ARPANET : réseau décentralisé, commutation de paquets (Donald Davies), TCP/IP (Kahn et Cerf).
- Le Web est une application d'Internet, parmi d'autres (messagerie, messagerie instantanée, P2P, FTP).

## Pièges fréquents

- Confondre le Web et Internet.
- Confondre Internet (public) et intranet (privé).
- Attribuer TCP/IP à Tim Berners-Lee : il est de Robert Kahn et Vint Cerf (Berners-Lee a créé le Web).
- Se fier aux dates précises du cours, qui se contredisent.

## Pour s'entraîner

Le quiz et le TD de ce module travaillent ces notions.


---

# Rappel de cours : Javascript – Le langage JavaScript



## Objectifs

- Situer JavaScript dans la triade HTML, CSS, JavaScript
- Insérer du JavaScript dans une page web de trois façons
- Déclarer et utiliser des variables, des chaînes et des nombres
- Comprendre la portée des variables
- Utiliser les conditions (if, switch) et les boucles (while, do/while, for)

## 1. Généralités

**JavaScript** (JS) est le langage de programmation du Web. La majorité des sites web modernes l'utilisent, et tous les navigateurs modernes (ordinateurs, consoles, tablettes, téléphones) le comprennent et l'interprètent.

| Langage | Il spécifie… |
|---|---|
| HTML | le contenu des pages web |
| CSS | la présentation des pages web |
| JavaScript | le comportement des pages web |

À l'origine, JavaScript était un langage côté client, standardisé par l'ECMA sous le nom **ECMAScript**. Depuis 2009, son usage a beaucoup évolué, côté client comme côté serveur (avec l'engouement autour de Node.js). Une nouvelle version, l'ECMAScript 2015 (ES6), a été ratifiée en juin 2015. À la rédaction du cours, ES5 était la version la mieux supportée par la plupart des navigateurs.

C'est un langage de **script**, **orienté objet**, **interprété par le navigateur**. Un script est, par opposition à un langage compilé, un langage qui s'interprète : ici, l'interprète est le navigateur du visiteur (le client).

> ⚠️ **Attention.** JavaScript est différent du langage de programmation Java.


## 2. Débuter : insérer du JavaScript dans une page

Pour débuter, il suffit d'un éditeur de texte (le Bloc-notes suffit ; le cours utilise Visual Studio Code, qui offre la coloration syntaxique) et d'un navigateur. Il y a **trois méthodes** pour insérer du JavaScript dans une page web.

**Exemple : Méthode 1 : directement dans une balise (gestionnaire d'événements)**

La propriété porte le nom de l'événement qui déclenche le script (ici onclick) et contient le script à exécuter. Le # évite de changer de page.

```javascript
<a href="#" onclick="alert('Bonjour !');">lien</a>
```

**Exemple : Méthode 2 : entre les balises <script> et </script>**

On les place dans l'en-tête (head) ou dans le corps (body). On précise le type du script.

```javascript
<head>
<title>Document</title>
<script type="text/javascript">
  /* votre code JavaScript se trouve ici : pratique pour plusieurs lignes */
</script>
</head>
```

**Exemple : Méthode 3 : dans un fichier externe**

Comme pour le CSS : le fichier a l'extension .js et on l'indique avec la propriété src (comme pour les images).

```javascript
<head>
<title>Document</title>
<script type="text/javascript" src="script.js"></script>
</head>
```


## 3. Valeurs et variables

Un programme manipule des **valeurs** (le nombre 3.14, le texte « Hello World »). Ce qu'un langage peut représenter s'appelle ses **types**. Pour conserver une valeur, le programme l'attribue à une **variable**, un nom symbolique pour une valeur. JavaScript sépare les instructions par un point-virgule (`;`), qu'on peut généralement omettre si les instructions sont sur des lignes distinctes.

**Règles pour le nom d'une variable** : il peut contenir les lettres de l'alphabet (majuscules et minuscules), les chiffres et le underscore, mais **ne doit pas commencer par un chiffre**. Les mots-clés du langage sont interdits (« break », « case », « continue », « delete », « new »…). JavaScript est **sensible à la casse** : `nom`, `Nom` et `NOM` sont trois variables différentes.

**Exemple : Déclarer et affecter**

On déclare avec var (jusqu'à ES5), puis on modifie la valeur avec le symbole d'affectation =.

```javascript
var annee;
var message;
annee = 2006;
message = "Bonjour, visiteur";
```

**ES6** ajoute `let` et `const`. `const` déclare une variable à assignation unique, dont la portée est le bloc.

> ⚠️ **Attention.** Le cours donne une liste de « mots interdits » où figurent char, double, final, long, public et super. Certains ne sont plus réservés dans le JavaScript récent : retiens surtout qu'on évite les mots-clés du langage.


## 4. Les chaînes de caractères

Une chaîne est une suite de caractères ordonnée, délimitée par des guillemets (`"`) ou des apostrophes (`'`). **Concaténer**, c'est mettre bout à bout plusieurs chaînes avec l'opérateur `+`.

**Exemple : Afficher « Vous avez 18 ans »**

Trois morceaux : « Vous avez », la variable age, « ans ». Attention aux espaces après « avez » et avant « ans ».

```javascript
var age = 18;
alert("Vous avez " + age + " ans");
```


## 5. Les nombres

Les nombres s'écrivent sans guillemets. On distingue les entiers (valeurs exactes) et les nombres à virgule, où l'on utilise un **point** comme séparateur (`1.234`).

| Opérateur | Rôle | Exemple |
|---|---|---|
| + | addition | 52 + 19 = 71 |
| - | soustraction | 52 - 19 = 33 |
| * | multiplication | 5 * 19 = 95 |
| / | division | 5 / 3 = 1,666… |
| % | modulo : reste de la division de a par b | 52 % 19 = 14 (car 52 = 19×2 + 14) |
| +=  -=  *=  /=  %= | raccourcis : resultat += X équivaut à resultat = resultat + X |  |
| ++  -- | incrémenter, décrémenter de 1 | compteur++ |

Pour convertir une chaîne en nombre : `parseInt(chaine)` (entier) et `parseFloat(chaine)` (décimal). Si la chaîne n'est pas un nombre, la conversion échoue et donne **NaN** (Not a Number).


## 6. La portée des variables

La **portée** d'une variable est la région du code où elle est définie. Une **variable globale** est définie partout. Une **variable locale** (déclarée dans une fonction, ou paramètre de fonction) n'existe que dans le corps de la fonction. Une variable locale est prioritaire sur une globale de même nom : elle la **masque**.

**Exemple : Masquage**

La fonction retourne la variable locale, pas la globale.

```javascript
var scope = "global";
function checkscope() {
  var scope = "local";
  return scope;
}
checkscope()   // => "local"
```


## 7. Les conditions

Par défaut, l'interpréteur exécute les instructions dans l'ordre. Les **conditions** (if, switch) font exécuter ou ignorer des instructions selon la valeur d'une expression.

**Exemple : if, else, else if**

if (!username) est vrai quand username vaut null, undefined, false, 0, "" ou NaN.

```javascript
if (n == 1) {
  console.log("Vous avez 1 nouveau message.");
} else if (n == 2) {
  console.log("Vous avez 2 nouveaux messages.");
} else {
  console.log("Vous avez " + n + " nouveaux messages.");
}
```

**Exemple : switch**

Quand toutes les branches dépendent de la valeur d'une même expression. S'il n'y a ni case correspondant ni bloc default, le switch ignore complètement le bloc de code.

```javascript
switch (typeof x) {
  case 'number': return x.toString(16);
  case 'string': return '"' + x + '"';
  default: return String(x);
}
```


## 8. Les boucles

Les boucles répètent des instructions. JavaScript a quatre instructions en boucle : `while`, `do/while`, `for` et `for/in`.

| Boucle | Particularité |
|---|---|
| while | Teste l'expression avant chaque tour : le corps peut ne jamais s'exécuter. while (true) fait une boucle infinie. |
| do/while | Teste l'expression en bas de la boucle : le corps est exécuté au moins une fois. |
| for | Regroupe initialisation, test et incrémentation sur une seule ligne. |
| for/in | Parcourt les propriétés d'un objet. |

**Exemple : Afficher les nombres de 0 à 9**

Les deux boucles sont équivalentes : la boucle for regroupe l'initialisation, le test et l'incrémentation.

```javascript
var count = 0;
while (count < 10) {
  console.log(count);
  count++;
}

for (var count = 0; count < 10; count++) {
  console.log(count);
}
```

**Exemple : for/in**

La boucle s'exécute une fois pour chaque propriété de l'objet.

```javascript
var person = {fname:"John", lname:"Doe", age:25};
var text = "";
var x;
for (x in person) {
  text += person[x] + " ";
}
// text vaut : John Doe 25
```

> ⚠️ **Attention.** Dans une boucle while, une variable doit évoluer à chaque tour. Sinon la condition reste vraie et la boucle ne se termine jamais. L'exemple du cours pour do/while contient une accolade manquante : retiens simplement sa syntaxe do { … } while (expression);

## À retenir

- JavaScript spécifie le comportement des pages (HTML : contenu, CSS : présentation). Il est interprété par le navigateur et ne se confond pas avec Java.
- Trois méthodes d'insertion : gestionnaire d'événements, balise <script>, fichier externe .js (propriété src).
- Le nom d'une variable ne commence pas par un chiffre ; JavaScript est sensible à la casse.
- Concaténer : mettre des chaînes bout à bout avec +. % donne le reste de la division.
- parseInt et parseFloat convertissent ; NaN signale une conversion impossible.
- Une variable locale masque une globale de même nom.
- do/while exécute le corps au moins une fois ; for regroupe initialisation, test et incrémentation.

## Pièges fréquents

- Confondre JavaScript et Java.
- Écrire des guillemets autour d'un nombre : il devient une chaîne.
- Oublier de modifier la variable dans une boucle while : boucle infinie.
- Croire que nom, Nom et NOM désignent la même variable.
- Oublier les espaces autour des morceaux lors d'une concaténation.
- Oublier le cas par défaut dans un switch : si rien ne correspond, tout est ignoré.

## Pour s'entraîner

Le quiz et le TD de ce module travaillent ces notions.


---

# Rappel de cours :Intro au Web – Présentation des réseaux : connexion à Internet



## Objectifs

- Connaître la connexion physique qui relie un ordinateur à Internet
- Identifier les principaux composants d'un ordinateur
- Décrire le rôle de la carte réseau et du modem
- Expliquer ce que sont TCP/IP et un protocole
- Utiliser la commande ping pour tester une connexion

## 1. Éléments requis pour une connexion à Internet

Internet est le plus important réseau de données au monde : une multitude de réseaux de tailles variées, reliés entre eux. Les ordinateurs personnels (PC) en sont les sources et les destinations d'information. Une connexion à Internet comprend **trois éléments**.

| Élément | Rôle |
|---|---|
| Connexion physique | Relie une carte d'interface du PC (modem ou carte réseau) à un réseau. Elle assure le transfert des signaux entre les PC d'un réseau local (LAN) et les équipements distants du réseau Internet. |
| Connexion logique | Utilise des normes appelées **protocoles** : ensemble formel de règles et de conventions régissant la communication entre unités réseau. Les protocoles TCP/IP sont les plus utilisés ; ils forment un ensemble qui assure la transmission des données. |
| Applications | Programmes qui interprètent les données et les affichent de façon compréhensible, en utilisant les protocoles pour envoyer et recevoir des données. |

Pour afficher du code HTML sous forme de page web, il faut un **navigateur** (Internet Explorer, Netscape…). Le protocole **FTP** (File Transfer Protocol) permet de télécharger des fichiers et des programmes depuis Internet. Les navigateurs peuvent utiliser des modules d'extension pour afficher des films ou des animations Flash.


## 2. Notions de base sur les PC

Les ordinateurs sont des éléments importants d'un réseau, et de nombreux équipements réseau sont des ordinateurs à usage déterminé, contenant des composants identiques à ceux d'un PC. On peut considérer les composants internes d'un PC comme un réseau d'équipements tous reliés au **bus** système.

| Composant | Définition |
|---|---|
| Processeur | Unité de contrôle et de calcul : interprète et exécute les instructions, effectue les opérations logiques et mathématiques. |
| Microprocesseur | Processeur de très petite taille, sur une puce de silicium. |
| Carte mère | Principale carte de circuits imprimés : contient le bus, le microprocesseur et les circuits de contrôle des périphériques. |
| Bus | Ensemble de lignes électriques sur la carte mère, qui transfèrent données et signaux de synchronisation entre les éléments de l'ordinateur. |
| Mémoire vive (RAM) | Mémoire en lecture/écriture ; elle perd toutes ses données si l'ordinateur est mis hors tension. |
| Mémoire morte (ROM) | Données préenregistrées, accessibles uniquement en lecture et impossibles à supprimer. |
| Unité centrale | Partie principale du PC : châssis, microprocesseur, mémoire centrale, bus et ports (clavier, moniteur et périphériques externes n'en font pas partie). |
| Emplacement d'extension | Fente de la carte mère pour insérer une carte : PCI (connexion rapide pour cartes réseau, modems internes, cartes vidéo) ou AGP (graphique). |
| Fond de panier | Carte offrant des circuits et connecteurs pour des cartes supplémentaires ; dans un ordinateur, souvent synonyme de carte mère. |
| Carte réseau | Carte d'extension qui connecte l'ordinateur à un réseau. |
| Disque dur | Dispositif de stockage à plateaux magnétisés. |

| Port | À retenir |
|---|---|
| Port série | Ne transmet qu'un seul bit à la fois |
| Port parallèle | Transfère plusieurs bits à la fois ; sert à connecter des imprimantes |
| Port USB | Connecte facilement et rapidement une souris ou une imprimante |
| Firewire | Interface série à haut débit, pour des données en temps réel |
| Port souris | Connecte une souris |


## 3. La carte réseau

Une carte réseau, aussi appelée adaptateur réseau, est nécessaire à l'ordinateur pour envoyer des informations au réseau et en recevoir. Dans un ordinateur de bureau, c'est une carte de circuits imprimés insérée dans un emplacement de la carte mère. Dans un portable, elle est généralement intégrée, ou prend la forme d'une **carte PCMCIA** (taille d'une carte de crédit). Tout équipement d'un réseau doit en avoir une.

La carte communique avec le **réseau** via une connexion **série**, et avec l'**ordinateur** par son **bus interne**. Pour dialoguer avec le système d'exploitation, elle utilise une demande d'interruption (IRQ), une adresse d'entrée/sortie (E/S) et de l'espace en mémoire haute.

Une valeur d'**IRQ** (Interrupt Request) désigne une adresse utilisée par un périphérique pour interrompre le processeur et lui envoyer des signaux. Exemple du cours : quand une imprimante termine un travail, elle envoie un signal d'interruption. Il faut une **valeur d'IRQ unique** par périphérique, pour éviter la confusion.

| Critère de choix d'une carte réseau | Exemples |
|---|---|
| Protocole | Ethernet, Token Ring, FDDI |
| Type de média | Câble à paires torsadées, câble coaxial, fibre optique |
| Type de bus système | PCI, ISA |


## 4. Le modem et l'installation des cartes

Le **modem** (modulateur-démodulateur) est l'équipement nécessaire pour relier l'ordinateur à une ligne téléphonique. Il **convertit les signaux numériques** des données de l'ordinateur en **signaux analogiques** compatibles avec une ligne téléphonique standard ; le modem de l'ordinateur récepteur les démodule, c'est-à-dire les retransforme en données numériques. Il peut être interne ou externe.

Une carte réseau doit être installée quand : un PC n'en a pas encore, quand elle est endommagée, pour passer de 10 Mbits/s à 10/100/1000 Mbits/s, pour installer un autre type de carte (sans fil par exemple), ou pour ajouter une carte de secours. Ces opérations peuvent demander de connaître la configuration de l'adaptateur, de disposer d'outils de diagnostic et de savoir résoudre des conflits entre ressources matérielles.


## 5. TCP/IP

**TCP/IP** (Transmission Control Protocol / Internet Protocol) désigne un ensemble de protocoles et de règles mis au point pour permettre aux ordinateurs de partager les ressources d'un réseau. On le configure avec les outils du système d'exploitation ; le processus diffère très peu entre Windows, Macintosh et Linux.


## 6. Tester une connexion avec la commande ping

La commande **ping** vérifie l'existence d'une adresse IP et son accessibilité. Elle fonctionne sur le modèle du sonar et tire son nom du bruit émis par cet appareil. Elle envoie des **datagrammes ICMP** (Internet Control Message Protocol), des messages de demande d'écho, à une destination. Chaque paquet envoyé équivaut à une demande de réponse. La réponse indique le **taux de réussite** et le **temps de parcours aller-retour**.

| Commande | Ce qu'elle teste |
|---|---|
| ping 127.0.0.1 | La boucle locale interne : vérifie la configuration réseau TCP/IP de la machine |
| ping adresse IP d'un hôte | La configuration TCP/IP de cet hôte et la connectivité avec lui |
| ping adresse IP de la passerelle par défaut | Que le routeur qui relie le réseau local aux autres réseaux est accessible |
| ping adresse IP d'un hôte distant | La connectivité avec un hôte distant |


## 7. Travaux pratiques associés

Les travaux pratiques du cours portent sur : le matériel de l'ordinateur (1.1.2), la configuration des paramètres TCP/IP (1.1.6), l'utilisation de ping et tracert (1.1.7) et la démarche élémentaire de dépannage d'un PC ou d'un réseau (1.1.9).

> ⚠️ **Attention.** Ce cours date de 2018 mais s'appuie sur du matériel plus ancien : disquettes, cédéroms, bus ISA, Token Ring, FDDI, Netscape, Flash. Les concepts restent valables, le matériel a évolué.

## À retenir

- Une connexion à Internet = connexion physique + connexion logique (protocoles) + applications.
- Un protocole est un ensemble formel de règles régissant la communication entre unités réseau ; TCP/IP est le plus utilisé.
- La carte réseau relie l'ordinateur au réseau : série côté réseau, bus interne côté ordinateur.
- Le modem convertit les signaux numériques en signaux analogiques, et inversement.
- RAM : perd ses données hors tension. ROM : lecture seule.
- ping 127.0.0.1 teste la boucle locale ; ping vers la passerelle teste le routeur ; ping utilise des datagrammes ICMP.

## Pièges fréquents

- Confondre la RAM (volatile) et la ROM (lecture seule).
- Confondre port série (un bit à la fois) et port parallèle (plusieurs bits).
- Penser que ping teste Internet : ping 127.0.0.1 teste seulement la machine elle-même.
- Attribuer la même valeur d'IRQ à deux périphériques : elle doit être unique.
- Oublier que le modem convertit numérique ↔ analogique.

## Pour s'entraîner

Le quiz et le TD de ce module travaillent ces notions.