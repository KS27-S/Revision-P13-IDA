# Inventaire et rapport de conformité du contenu pédagogique

Document établi en lecture seule : **aucun fichier de contenu existant n'a été modifié** pour établir ce rapport. Il complète `GUIDE_CONTENU.md`.

## 1. Méthode

Recherche de tous les `.json` et `.md` du projet, hors `node_modules` et `.git`, puis ouverture des fichiers réellement liés aux rappels, quiz et TD. Le cahier des charges utilisé est `Cahier des charges — Plateforme de révision IDA P13.md` (le dépôt ne contient pas de fichier nommé `CAHIER_DES_CHARGES.md`).

## 2. Formats réels : LA référence du projet

### 2.1 `public/quiz-contenu/content/_index.json`

Fichier de sommaire. Clé racine `matieres`, chaque entrée contenant `id`, `titre`, `dossier`, `fichier`, `modules`, `questions`, `td`. Extrait réel (lignes 2-11) :

```json
{ "id": "algorithmique", "titre": "Algorithmique", "dossier": "algorithmique",
  "fichier": "_matiere.json", "modules": 4, "questions": 80, "td": 33 }
```

**Piège réel** : pour l'algorithmique, `dossier` vaut `algorithmique` alors que le dossier sur disque est `algorithme` et que le `_matiere.json` déclare `"id": "algorithmique"`. L'import doit retrouver le dossier par l'id du `_matiere.json`, pas faire aveuglément confiance à `dossier`.

### 2.2 `public/quiz-contenu/content/<dossier>/_matiere.json`

Une entrée par matière : `id`, `titre`, puis `modules` avec `id`, `titre`, `quiz` (nom de fichier) et `td` (nom de fichier ou `null`). Extrait réel de `intro-web/_matiere.json` (lignes 5-10) :

```json
{ "id": "reseau-internet", "titre": "Réseau informatique et Internet",
  "quiz": "reseau-internet.quiz.json", "td": null }
```

### 2.3 `public/quiz-contenu/content/<dossier>/<module>.quiz.json`

Clés racines : `matiere`, `module`, `titre`, `sources` (tableau de chaînes), `questions`. Chaque question contient :

- `niveau` : `"facile"`, `"moyen"` ou `"difficile"` ;
- `enonce` : chaîne ;
- `choix` : tableau de **4** chaînes ;
- `reponse` : **entier 0 à 3** (index de la bonne réponse dans `choix`) ;
- `explication` : chaîne ;
- `id` : identifiant court unique ;
- `code` : présent sur 40 questions, extrait de code à afficher avec l'énoncé.

Extrait réel de `intro-web/web-client-serveur.quiz.json` (lignes 10-22) :

```json
{ "niveau": "facile", "enonce": "Qu'est-ce que le World Wide Web ?",
  "choix": ["Un autre nom d'Internet", "Une des applications d'Internet : un système hypertexte public consulté avec un navigateur", "Un logiciel de messagerie", "Un langage de programmation"],
  "reponse": 1, "explication": "Le Web est aussi appelé « la Toile ».", "id": "web-s2-01" }
```

### 2.4 `public/quiz-contenu/content/<dossier>/<module>.td.json`

Clés racines : `matiere`, `module`, `titre`, `exercices`. Deux variantes réelles coexistent :

**Variante A — 140 exercices sur 32 fichiers** (format TD attendu). Chaque exercice contient `id`, `type`, `titre`, `source`, `statut_corrige`, `enonce_simple`, `indices` (tableau), `solution`, `explication_simple`, et parfois `attention`. Extrait réel de `intro-web/web-client-serveur.td.json` (lignes 6-20).

**Variante B — 50 exercices dans un seul fichier** `developpement-mobile/introduction-mobile.td.json`. Chaque exercice contient `id`, `type: "qcm"`, `numero_original`, `source`, `statut_corrige`, `enonce`, `choix`, `reponse`, `explication`. Il n'y a **ni** `enonce_simple`, **ni** `indices`, **ni** `solution`, **ni** `explication_simple`.

### 2.5 Rappels : `relecture-8-rappels-gratuits.md` et `donnees/rappels-source.html`

Il n'existe **pas** de fichier `.json` de rappel, ni de fichier `.md` par module. Le format réel est un gros fichier Markdown dont les 8 fiches sont séparées par `---`, avec par exemple :

```md
# Rappel de cours : Algorithme – Introduction à l'algorithmique
*Lecture : environ 10 minutes · brouillon rédigé par Claude ...*
## Objectifs
## 1. La notion d'algorithme
...
## À retenir
## Pièges fréquents
## Pour s'entraîner
```

`donnees/rappels-source.html` est la même source convertie en HTML (`<details><summary>…</summary><div class="rappel">…</div></details>`) avec laquelle les 8 rappels déjà en base ont été importés (`npm run importer-rappels`). La base contient aujourd'hui **8 rappels**, un par premier module de matière. Aucun texte n'est à réécrire.

### 2.6 Documentation `.md` sans contenu pédagogique importable

- `Cahier des charges — Plateforme de révision IDA P13.md` (racine et copie dans `Revision-P13-IDA/`) : règles du projet, pas un contenu de module.
- `Revision-P13-IDA/README.md` : une seule ligne, aucune fiche.
- `relecture-8-rappels-gratuits.md` : contient bien les 8 rappels, format décrit ci-dessus.

## 3. Inventaire module par module

Tous les chemins sont relatifs à `public/quiz-contenu/content/`. « TD — » signifie qu'aucun fichier TD n'existait avant l'étape 4 (gabarit vide créé ensuite).

| Matière | Module | Quiz | TD |
|---|---|---|---|
| algorithmique | introduction | `algorithme/introduction.quiz.json` | `algorithme/introduction.td.json` |
| algorithmique | structures-controle | `algorithme/structures-controle.quiz.json` | `algorithme/structures-controle.td.json` |
| algorithmique | sous-programmes | `algorithme/sous-programmes.quiz.json` | `algorithme/sous-programmes.td.json` |
| algorithmique | tableaux-structures | `algorithme/tableaux-structures.quiz.json` | `algorithme/tableaux-structures.td.json` |
| developpement-mobile | introduction-mobile | `developpement-mobile/introduction-mobile.quiz.json` | `developpement-mobile/introduction-mobile.td.json` |
| developpement-mobile | android-studio | `developpement-mobile/android-studio.quiz.json` | `developpement-mobile/android-studio.td.json` |
| developpement-mobile | notions-android | `developpement-mobile/notions-android.quiz.json` | TD — |
| developpement-mobile | hybrides-ionic | `developpement-mobile/hybrides-ionic.quiz.json` | TD — |
| environnement-mobile | introduction-technologies-mobiles | `environnement-mobile/introduction-technologies-mobiles.quiz.json` | `environnement-mobile/introduction-technologies-mobiles.td.json` |
| environnement-mobile | plateformes-os-mobiles | `environnement-mobile/plateformes-os-mobiles.quiz.json` | `environnement-mobile/plateformes-os-mobiles.td.json` |
| environnement-mobile | approches-developpement | `environnement-mobile/approches-developpement.quiz.json` | `environnement-mobile/approches-developpement.td.json` |
| environnement-mobile | ide-mobile | `environnement-mobile/ide-mobile.quiz.json` | `environnement-mobile/ide-mobile.td.json` |
| html-css | introduction-html-css | `html-css/introduction-html-css.quiz.json` | `html-css/introduction-html-css.td.json` |
| html-css | elements-attributs-html | `html-css/elements-attributs-html.quiz.json` | `html-css/elements-attributs-html.td.json` |
| html-css | caracteres-metadonnees | `html-css/caracteres-metadonnees.quiz.json` | `html-css/caracteres-metadonnees.td.json` |
| html-css | styles-couleurs | `html-css/styles-couleurs.quiz.json` | `html-css/styles-couleurs.td.json` |
| html-css | feuilles-de-style-css | `html-css/feuilles-de-style-css.quiz.json` | `html-css/feuilles-de-style-css.td.json` |
| html-css | elements-multimedias | `html-css/elements-multimedias.quiz.json` | `html-css/elements-multimedias.td.json` |
| html-css | tableaux-listes | `html-css/tableaux-listes.quiz.json` | `html-css/tableaux-listes.td.json` |
| html-css | mise-en-page | `html-css/mise-en-page.quiz.json` | `html-css/mise-en-page.td.json` |
| html-css | formulaires | `html-css/formulaires.quiz.json` | `html-css/formulaires.td.json` |
| initiation-programmation | decouverte-scratch | `initiation-programmation/decouverte-scratch.quiz.json` | `initiation-programmation/decouverte-scratch.td.json` |
| initiation-programmation | programmer-avec-scratch | `initiation-programmation/programmer-avec-scratch.quiz.json` | `initiation-programmation/programmer-avec-scratch.td.json` |
| intro-web | reseau-internet | `intro-web/reseau-internet.quiz.json` | TD — |
| intro-web | web-client-serveur | `intro-web/web-client-serveur.quiz.json` | `intro-web/web-client-serveur.td.json` |
| intro-web | site-web-hebergement | `intro-web/site-web-hebergement.quiz.json` | `intro-web/site-web-hebergement.td.json` |
| intro-web | webmastering-metiers | `intro-web/webmastering-metiers.quiz.json` | `intro-web/webmastering-metiers.td.json` |
| intro-web | langages-du-web | `intro-web/langages-du-web.quiz.json` | `intro-web/langages-du-web.td.json` |
| intro-web | noms-de-domaine | `intro-web/noms-de-domaine.quiz.json` | TD — |
| javascript | langage-javascript | `javascript/langage-javascript.quiz.json` | `javascript/langage-javascript.td.json` |
| javascript | objets-tableaux-fonctions | `javascript/objets-tableaux-fonctions.quiz.json` | `javascript/objets-tableaux-fonctions.td.json` |
| javascript | javascript-navigateurs | `javascript/javascript-navigateurs.quiz.json` | TD — |
| reseau | presentation-reseaux | `reseau/presentation-reseaux.quiz.json` | `reseau/presentation-reseaux.td.json` |
| reseau | aspects-mathematiques | `reseau/aspects-mathematiques.quiz.json` | `reseau/aspects-mathematiques.td.json` |
| reseau | notions-de-base | `reseau/notions-de-base.quiz.json` | `reseau/notions-de-base.td.json` |
| reseau | medias-reseau | `reseau/medias-reseau.quiz.json` | `reseau/medias-reseau.td.json` |
| reseau | cablage-lan-wan | `reseau/cablage-lan-wan.quiz.json` | `reseau/cablage-lan-wan.td.json` |

Totaux relevés : **37 quiz / 740 questions**, **32 fichiers TD / 190 exercices**, **8 rappels**, **8 matières**, **37 modules**.

## 4. Rapport de conformité

Règles appliquées telles qu'écrites dans le cahier : 20 questions par quiz (7 faciles, 7 moyennes, 6 difficiles), 4 choix, bonne réponse présente, explication présente. Barème : 14/20 = 70 % pour la réussite ; 10/20 = 50 % pour valider le module (« à revoir » entre les deux). TD : énoncé simplifié, indices, solution et explication simple.

### 4.1 Quiz : aucun écart

Les 37 fichiers sont conformes : 20 questions, répartition 7/7/6, 4 choix, `reponse` entier valide, `explication` non vide, 20 identifiants uniques par fichier. Le barème n'est pas dans les fichiers : il est appliqué par le serveur. Le champ facultatif `code` (40 questions) est conservé tel quel.

### 4.2 TD : écarts

| Matière / module | Écart constaté | Décision attendue |
|---|---|---|
| developpement-mobile / introduction-mobile | Les 50 exercices utilisent la variante B (`enonce`, `choix`, `reponse`, `explication`) : absence de `enonce_simple`, `indices`, `solution`, `explication_simple`. | À arbitrer : convertir le format ou accepter la variante QCM comme un format officiel. **Non corrigé ici.** |
| developpement-mobile / notions-android | Aucun fichier TD. | Gabarit vide créé, statut `vide`. |
| developpement-mobile / hybrides-ionic | Aucun fichier TD. | Gabarit vide créé, statut `vide`. |
| intro-web / reseau-internet | Aucun fichier TD (déjà signalé comme « à clarifier » dans le cahier). | Gabarit vide créé, statut `vide`. |
| intro-web / noms-de-domaine | Aucun fichier TD. | Gabarit vide créé, statut `vide`. |
| javascript / javascript-navigateurs | Aucun fichier TD. | Gabarit vide créé, statut `vide`. |

Les 31 autres fichiers TD (140 exercices) contiennent tous les champs attendus. Tous les exercices portent une mention `statut_corrige` indiquant que le corrigé a été rédigé par Claude et doit être validé par un enseignant : la publication reste une décision administrative.

### 4.3 Rappels : écart global

37 rappels sont prévus, 8 existent (les modules offerts). Les 29 autres n'ont aucun texte source. Des gabarits vides, au format Markdown existant, sont créés dans `donnees/rappels-a-rediger.md` avec le statut `vide`. Aucun texte de cours n'est inventé.
