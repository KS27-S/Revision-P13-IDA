# Guide du contenu pédagogique — Révision P13 IDA

Ce guide explique où se trouve le cours, comment le modifier sans casser le
site, et comment le rendre visible aux étudiants.

## Règles d'or

1. **On n'invente pas de cours.** On recopie seulement le contenu des supports
   fournis (PDF, fiches TD, anciens rappels). Si une source manque, on laisse le
   gabarit vide.
2. **On ne modifie pas la base à la main.** Les fichiers sont la source ; la base
   est remplie par les scripts.
3. **On ne publie pas automatiquement.** L'import crée des `brouillon` ; c'est
   l'administrateur qui clique sur « Publier » dans `admin.html`.
4. **On garde le format existant.** Les fichiers JSON et Markdown sont déjà
   utilisés : on n'en invente pas un nouveau.
5. **On ne touche pas aux 8 rappels déjà importés.** Leur texte est figé dans la
   base ; l'import ne l'écrase pas.

## Où sont les fichiers

```
public/quiz-contenu/content/_index.json          # liste des 8 matières
public/quiz-contenu/content/<matiere>/_matiere.json
public/quiz-contenu/content/<matiere>/<module>.quiz.json   # 37 fichiers
public/quiz-contenu/content/<matiere>/<module>.td.json     # 32 + 5 gabarits vides
donnees/rappels-source.html                       # source HTML des 8 rappels
donnees/rappels-a-rediger.md                      # 29 gabarits vides (uns seulement)
relecture-8-rappels-gratuits.md                   # relecture des 8 rappels existants
RAPPORT_CONTENU.md                                # inventaire et conformité
```

Attention : dans `_index.json`, la matière `algorithmique` pointe vers le
dossier `algorithme`. C'est normal, l'import retrouve le bon dossier grâce à
l'`id` du `_matiere.json`.

## Corriger ou ajouter un quiz

Un quiz contient **exactement 20 questions** :

- 7 `facile`, 7 `moyen`, 6 `difficile` ;
- 4 choix par question ;
- `reponse` = l'index du bon choix, de **0 à 3** ;
- `explication` obligatoire ;
- `id` unique dans le fichier.

Exemple réel extrait de
`public/quiz-contenu/content/intro-web/web-client-serveur.quiz.json` :

```json
{
  "matiere": "intro-web",
  "module": "web-client-serveur",
  "titre": "Le Web et le concept client/serveur",
  "sources": [
    "Séquence 2_Le Web et le concept.pdf",
    "Travaux Dirigés_2.pdf"
  ],
  "questions": [
    {
      "niveau": "facile",
      "enonce": "Qu'est-ce que le World Wide Web ?",
      "choix": [
        "Un autre nom d'Internet",
        "Une des applications d'Internet : un système hypertexte public consulté avec un navigateur",
        "Un logiciel de messagerie",
        "Un langage de programmation"
      ],
      "reponse": 1,
      "explication": "Le Web est aussi appelé « la Toile ».",
      "id": "web-s2-01"
    }
  ]
}
```

Dans cet exemple, `"reponse": 1` veut dire : la deuxième proposition est la
bonne, car on compte à partir de 0.

Après modification, lancer :

```bash
npm run importer-contenu
```

Le script vérifie les 20 questions et refuse d'importer un fichier invalide.
Il n'écrase jamais un contenu verrouillé par l'administrateur et ne crée pas de
doublon.

## Corriger ou ajouter un TD

Format attendu (exemple réel de
`public/quiz-contenu/content/algorithme/introduction.td.json`) :

```json
{
  "matiere": "algorithmique",
  "module": "introduction",
  "titre": "TD – Introduction à l'algorithmique",
  "exercices": [
    {
      "id": "algo-introduction-td-01",
      "titre": "Calculer le prix d'un achat (HT, TVA, TTC)",
      "source": "Correction des TD d'Algorithmique 1 (...)",
      "statut_corrige": "corrigé fourni dans le support",
      "enonce_simple": "Un client achète plusieurs articles…",
      "indices": [
        "PHT = prix d'un article × nombre d'articles.",
        "TVA = PHT × 0,18."
      ],
      "solution": "Algorithme CalculPrix\nVariables : …",
      "explication_simple": "On lit deux données, on enchaîne trois calculs…",
      "type": "exercice"
    }
  ]
}
```

Chaque exercice doit garder `enonce_simple`, `indices`, `solution` et
`explication_simple`. Les champs `attention` et `code` sont facultatifs.

Cinq modules n'ont pas de support TD. Ils ont un fichier vide avec
`"exercices": []` : ils resteront `vide` et non publiables tant que le support
n'existe pas.

Un fichier est signalé incomplet : `developpement-mobile/introduction-mobile.td.json`
utilise l'ancien format QCM (`enonce`, `choix`, `reponse`) et n'a ni solution
détaillée ni explication simple. Il n'est pas importé. Le corriger dans le
format ci-dessus si le support est retrouvé.

## Ajouter un rappel de cours

Les 8 rappels gratuits sont déjà dans `donnees/rappels-source.html`. Pour en
ajouter un nouveau :

1. Remplir une fiche vide de `donnees/rappels-a-rediger.md` avec le même plan :
   `Objectifs`, sections numérotées, `À retenir`, `Pièges fréquents`,
   `Pour s'entraîner`. Ne rien inventer.
2. Reporter ce contenu dans `donnees/rappels-source.html` en respectant
   exactement l'indentation et la structure :
   `<div class="rappel">`, `<details id="rappel-...">`, `<summary>Matière — Titre du module</summary>`,
   puis le cours dans un second `<div class="rappel">`.
3. Le titre après le tiret doit être **exactement** le titre du module en base,
   sinon l'import ne trouve pas le module.
4. Lancer les scripts dans l'ordre :

```bash
npm run init-contenu
npm run importer-rappels
npm run importer-contenu
```

`importer-rappels` ignore les modules qui ont déjà une fiche. `importer-contenu`
ne change jamais le texte des rappels : il crée seulement la ligne de suivi avec
le statut `brouillon`.

## Commandes utiles

```bash
npm run init-contenu       # crée matières/modules/offres si la base est neuve
npm run importer-rappels   # charge les rappels absents de la base
npm run importer-contenu   # valide et charge quiz + TD, sans rien publier
npm test                   # lance tous les tests
```

Pour travailler sur une base de test sans toucher à la vraie :

```bash
$env:DB_PATH="C:\Users\DELL\AppData\Local\Temp\opencode\revision-test.sqlite"
npm run init-contenu
npm run importer-contenu
```

## Publier depuis l'administration

Ouvrir `admin.html`, puis la section **Suivi des contenus** :

- une ligne par module et par type (`rappel`, `quiz`, `td`) ;
- colonne **État** : `Vide`, `Brouillon` ou `Publié` ;
- colonne **Vérification** : indique si le contenu est complet et valide ;
- **Publier** est désactivé si le contenu est vide, incomplet ou verrouillé ;
- **Tout publier** ne traite que les contenus complets et non verrouillés ;
- **Verrouiller** empêche le prochain import d'écraser une correction manuelle.

Les 8 rappels existants sont marqués `publie` lors du premier import pour
refléter leur comportement actuel. Aucun nouveau contenu n'est publié sans
clic de l'administrateur.
