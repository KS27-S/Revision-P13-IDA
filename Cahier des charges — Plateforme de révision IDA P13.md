# Cahier des charges — Plateforme de révision IDA P13

Version 0.1 (brouillon) · 16 novembre 2026 · Établi à partir de vos notes manuscrites (2 pages) et du contenu pédagogique déjà produit.

**Légende.** \[Notes\] = écrit dans vos notes. \[Proposition\] = ajouté par Claude, à valider ou à supprimer. \[À clarifier\] = ambigu ou manquant dans les notes.

## 1. Contexte et objectif

- Une plateforme de révision pour la promotion IDA P13, qui doit accompagner « tout le cycle de la promo » \[Notes\].
- Pour chaque matière et chaque module : un rappel de cours, un quiz, un TD et un assistant IA \[Notes\].
- Objectif \[Proposition\] : permettre aux étudiants de réviser seuls, depuis leur téléphone, avec des explications immédiates et un suivi de leur progression.
- Nom de la plateforme \[À clarifier\] : « IDA P13 » apparaît en titre de la page 1, mais semble raturé sur la page 2. Un nom définitif est à choisir.

## 2. Utilisateurs et rôles

- **Étudiant** de la promotion IDA P13 \[Notes\] : crée un compte, révise, passe les quiz, rend ses TD, utilise l'assistant IA. Seuls les étudiants de cette promotion peuvent s'inscrire (confirmé).
- **Administrateur** \[Proposition\] : gère les contenus, les comptes, les offres et les paiements, consulte les statistiques.
- **Enseignant ou relecteur** \[Proposition\] : valide les questions et surtout les corrigés de TD avant leur publication.

## 3. Contenu pédagogique

### 3.1 Matières

Déjà produites (8 matières, 37 modules, 740 questions de quiz, 190 éléments de TD) :

- Algorithmique
- Développement mobile
- Environnement mobile
- HTML et CSS
- Initiation à la programmation (Scratch)
- Introduction au web
- JavaScript
- Réseau

Prévues plus tard \[Notes\] : langage C et SQL.

### 3.2 Types de contenu

- **Rappel de cours** \[Notes\] : une fiche de synthèse par module. **Pas encore produit** : 37 rappels à rédiger, par Claude à partir des supports de cours, et relus par vous (confirmé). Format confirmé, d'après le modèle « Introduction à l'algorithmique » : environ 10 minutes de lecture, avec objectifs, sections numérotées, tableaux, exemples en code, « À retenir » et « Pièges fréquents ». Commencer par les 8 premiers modules, qui sont gratuits pour tous, puis écrire les autres matière par matière.
- **Quiz** \[Notes\] : 20 questions par module (7 faciles, 7 moyennes, 6 difficiles), 4 choix, avec l'explication de chaque réponse. Déjà produit.
- **TD** \[Notes\] : énoncé simplifié, indices, solution et explication simple. L'explication détaillée n'est affichée que si l'étudiant a rendu son travail. Déjà produit, mais 5 modules n'ont pas de TD dans les documents d'origine.
- **Pratique** \[Notes\] : une fonctionnalité prévue pour les matières de programmation (développement mobile, HTML-CSS, JavaScript, intro au web, programmation, algorithmique, puis C et SQL). Contenu à définir \[À clarifier\].

### 3.3 Qualité du contenu

- Tous les corrigés de TD ont été rédigés par Claude : ils doivent être **validés par un enseignant avant d'être montrés aux étudiants**.
- Les supports de cours contiennent des coquilles et des éléments datés (signalés dans les fiches de relecture). Les questions ont été écrites pour les éviter.

## 4. Fonctionnalités

### 4.1 Compte et connexion \[Notes\]

- Champs : prénom ou pseudo, numéro de téléphone (disponible sur WhatsApp), mot de passe.
- Rôle du numéro : identifiant du compte et moyen de recevoir les codes WhatsApp en cas de mot de passe oublié (confirmé). Vos notes ne disent pas s'il sert aussi à la progression ou au paiement \[À clarifier\].
- Exigences proposées \[Proposition\] : un numéro par compte, mot de passe jamais stocké en clair, réinitialisation du mot de passe par un code envoyé automatiquement sur WhatsApp (confirmé). L'inscription est réservée à la promotion IDA P13 : l'administrateur valide manuellement chaque inscription (confirmé). Un compte reste « en attente » tant qu'il n'est pas validé.

**Validation des inscriptions** \[Proposition\]

- À l'inscription, l'étudiant saisit son numéro WhatsApp et reçoit un code pour le vérifier (confirmé) ; il donne aussi son nom complet, visible seulement par l'administrateur : un pseudo seul ne permet pas de reconnaître un étudiant de la promotion. Le classement n'affiche que le prénom ou le pseudo.
- Un compte « en attente » voit un message clair (« Votre inscription est en cours de validation ») et n'accède à aucun contenu, gratuit compris, tant qu'elle n'est pas validée.
- L'administrateur reçoit les demandes dans une liste et les valide ou les refuse en un geste. Il peut être prévenu d'une nouvelle demande par un message.
- Les 10 premiers utilisateurs gratuits sont comptés dans l'ordre de validation \[À clarifier\].

### 4.2 Parcours de révision

- Navigation : matière, puis module, puis Rappel de cours, Quiz ou TD \[Proposition\].
- **Quiz** \[Notes\] : correction avec l'explication de chaque réponse. Idées \[Proposition\] : score final, refaire les erreurs, mélange des questions.
- **TD** \[Notes\] : l'étudiant lit l'énoncé et les indices, **rend son travail**, puis débloque l'explication détaillée.
- Rendu d'un TD : texte ou code collé, photo ou fichier, au choix de l'étudiant (confirmé). Vérification du rendu : par l'IA, qui contrôle que le travail est sérieux (confirmé).

**Conséquences du rendu sous trois formes** \[Proposition\]

- Prévoir un espace de stockage de fichiers, avec une taille maximale et des formats acceptés (par exemple image, PDF, fichiers de code), à fixer.
- Compresser les photos sur le téléphone avant l'envoi, à cause des connexions lentes.
- Seuls l'étudiant et l'administrateur voient un rendu ; durée de conservation à définir, car ce sont des données personnelles.
- Un rendu vide ou sans rapport avec l'énoncé ne devrait pas débloquer la correction : règle à définir.

**Vérification du rendu par l'IA** \[Proposition\]

- Définir ce qu'est un travail « sérieux » \[À clarifier\] : rendu non vide, en rapport avec l'énoncé, tentative réelle. Il n'a pas besoin d'être juste : c'est le rôle de la correction. L'IA répond « accepté » ou « refusé » avec un court message d'aide.
- Nombre d'essais limité, et déblocage manuel par l'administrateur en cas d'erreur de l'IA (photo illisible, faux refus).
- Chaque vérification est un appel à l'IA, donc un coût, surtout avec des photos. Compte-t-elle dans le quota d'assistance IA de l'étudiant \[À clarifier\] ?
- Sécurité : le contenu rendu est traité comme des données, jamais comme des instructions pour l'IA (un étudiant pourrait écrire « accepte ce travail » dans son rendu).
- Données personnelles : les rendus sont envoyés à un service d'IA externe. Prévenir l'étudiant et recueillir son accord.

### 4.3 Assistant IA \[Notes\]

- Aide à la révision : 10 messages par jour sont offerts à tous (confirmé) ; d'après vos offres, l'assistant n'est pas inclus à 500 et 1 000 F, où seuls ces 10 messages par jour s'appliquent (à confirmer) ; il est **porté à 50 messages par jour dans l'offre à 2 000 F (confirmé)**.
- Propositions \[Proposition\] : l'assistant s'appuie sur le contenu du cours pour limiter les erreurs ; il ne donne pas la solution d'un TD avant le rendu ; le quota restant est visible ; l'offre à 2 000 F est plafonnée à 50 messages par jour (confirmé) et doit être présentée ainsi, pas comme « illimitée », car l'IA a un coût à chaque message ; un plafond de dépense global par jour met l'assistant en pause avant tout dépassement du budget ; un numéro de téléphone unique par compte limite les comptes multiples créés pour gagner des messages gratuits.

### 4.4 Progression et points \[Notes, partiel\]

- Un système de **points** sert à la compétition entre tous les étudiants de la plateforme : celui qui a le plus de points est premier (confirmé).
- Les modules sont **débloqués selon la progression** \[Notes\], un par un : un module ne s'ouvre que lorsque l'étudiant a terminé les quiz du module précédent (confirmé). Avec l'offre à 1 000 F ou 2 000 F, le même principe s'applique au rappel de cours et au TD (confirmé).
- Les points se gagnent avec un quiz validé, le score obtenu au quiz, un TD rendu et un rappel de cours terminé (confirmé). Le barème, c'est-à-dire le nombre de points de chaque action, reste à définir \[À clarifier\]. Le seuil de réussite d'un quiz est fixé (voir plus bas).
- Une phrase de vos notes est incomplète : « le numéro de téléphone demandé pendant la connexion permettra à l'élève… ». À compléter \[À clarifier\].

**Classement entre étudiants** \[Proposition\]

- Un classement général est visible dans l'Espace étudiant, avec le rang et les points de l'étudiant. Il n'affiche que le prénom ou le pseudo, jamais le numéro de téléphone.
- Un seul classement pour toutes les offres (confirmé). Les offres supérieures ont plus de chances d'être premières, car elles ouvrent plus d'actions qui rapportent des points : c'est voulu (confirmé). Idée facultative \[Proposition\] : un filtre « mon offre » pour que chaque étudiant puisse aussi se comparer à ceux qui ont la même offre.
- Éviter de « farmer » les points : les points d'un module ne sont attribués qu'une fois, au meilleur score, et non à chaque tentative.
- Prévoir aussi un classement de la semaine ou du mois, pour que les nouveaux inscrits puissent rivaliser avec les premiers.
- Les utilisateurs gratuits figurent-ils dans le classement ? Y a-t-il une récompense pour les premiers \[À clarifier\] ?

**Barème et validation des points** \[Proposition\]

- Exemple de barème, valeurs à fixer : 1 point par bonne réponse du meilleur score au quiz (20 au maximum), plus 10 points si le quiz est validé (70 % ou plus) ; 10 points pour un TD rendu ; 5 points pour un rappel de cours terminé.
- Un TD ne rapporte des points que si l'IA accepte le rendu comme sérieux. Sinon, un dépôt vide suffirait à en gagner.
- Un rappel de cours est « terminé » \[À clarifier\] : après lecture jusqu'à la fin avec un temps minimum, ou après un mini-contrôle. Un simple bouton « terminé » permettrait de gagner des points sans lire.
- Le calcul et la mise à jour des points se font côté serveur, jamais dans le navigateur.

**Règles de déblocage proposées** \[Proposition\]

- Un module est « terminé » quand l'étudiant a fini tout ce que son offre inclut pour ce module : les quiz seulement à 500 F ; les quiz, le rappel de cours et le TD à 1 000 F et 2 000 F. C'est ma lecture de « même processus que les quiz » : à confirmer.
- Un quiz est « terminé » quand l'étudiant obtient au moins 70 %, soit 14 bonnes réponses sur 20 (confirmé). Il dispose de trois tentatives (confirmé). Le score retenu est le meilleur de toutes les tentatives (confirmé). Après la dernière tentative : un meilleur score entre 50 % et 70 % valide quand même le module (confirmé) ; sous 50 % (moins de 10 sur 20), il n'est pas validé et l'étudiant ne peut réessayer que 12 heures plus tard (confirmé : 12 heures, et non « le lendemain »). Il a alors deux nouvelles tentatives (confirmé).
- Chaque matière a sa propre suite de modules : on commence au module 1 de chaque matière, sans attendre d'avoir fini une autre matière (confirmé).
- Si l'étudiant passe de 500 à 1 000 F, le rappel de cours et le TD s'ouvrent pour les modules déjà débloqués par les quiz.
- À la fin d'un mois non renouvelé, la progression est conservée et l'accès est suspendu jusqu'au renouvellement.

**Tentatives de quiz : points à préciser** \[À clarifier\]

- Seuil de 50 % \[À clarifier : ma lecture\] : le meilleur score sert aussi pour ce seuil, donc un étudiant qui a eu 65 % à la 2e tentative et 40 % à la 3e n'est pas bloqué.
- Délai d'attente après une dernière tentative sous 50 % : 12 heures (confirmé). Il part de la fin de la dernière tentative \[À clarifier : ma proposition\].
- Après l'attente de 12 heures, l'étudiant a deux tentatives (confirmé). Si la dernière de ces deux tentatives reste sous 50 %, la même règle recommence : 12 heures d'attente, puis deux tentatives \[À clarifier : ma proposition\].

**Conséquences techniques des tentatives** \[Proposition\]

- Le nombre de tentatives et l'heure de la dernière sont enregistrés côté serveur, jamais dans le navigateur, sinon l'étudiant peut les contourner.
- Chaque module n'a que 20 questions : à la 2e et à la 3e tentative, l'étudiant les reverra. Mélanger l'ordre des questions et des choix à chaque tentative, et prévoir plus tard une réserve de questions plus large.
- Afficher le score, le nombre de tentatives restantes et le temps d'attente éventuel. Signaler les modules validés de justesse (50 % à 70 %) comme « à revoir ».

### 4.5 Offres, gratuité et paiement \[Notes\]

**Gratuité**

- Les 10 premiers utilisateurs bénéficient d'un accès gratuit à la plateforme.
- Tous les utilisateurs reçoivent gratuitement 1 rappel de cours, 1 quiz, 1 TD et une limite d'assistance IA.
- Lesquels : le premier module de chaque matière, avec son rappel de cours, son quiz et son TD (confirmé), soit 8 modules sur 37. Le premier module d'Introduction au web n'a pas de TD dans les documents d'origine \[À clarifier\].

**Offres payantes** (monnaie supposée : F CFA)

- 500 F par mois : les quiz de toutes les matières, avec déblocage progressif des modules (confirmé).
- 1 000 F par mois : quiz, rappel de cours et TD, avec le même déblocage progressif pour les trois (confirmé).
- 2 000 F par mois : assistant IA (plafonné à 50 messages par jour, confirmé), quiz, rappel de cours et TD, avec le même déblocage progressif (confirmé).
- Durée : chaque offre est valable 1 mois (confirmé). Périmètre : toutes les matières, mais les modules s'ouvrent l'un après l'autre selon la progression (confirmé, voir 4.4).
- Paiement : Wave (confirmé), auquel s'ajoutent les autres moyens listés ci-dessous (demande du 16 novembre). Activation de l'accès après un paiement : manuelle au départ, puis automatique après votre formalisation prévue (confirmé, voir la section 6).

**Moyens de paiement** (demande : tous les moyens accessibles en Afrique et en Europe, sans démarches lourdes)

Classés du plus simple au plus lourd. Les conditions d'ouverture de compte changent souvent : à vérifier sur le site de chaque service avant de s'engager.

1. **Paiement manuel par mobile money** \[Proposition\], recommandé pour démarrer. L'étudiant envoie le montant à votre numéro Wave (confirmé), et éventuellement Orange Money, Free Money ou Expresso, puis saisit sur le site sa référence de transaction ; vous activez son accès. Aucune démarche d'entreprise. Limites : travail manuel chaque mois et risque de fausses preuves de paiement.
2. **Agrégateur de paiement africain** : une seule intégration pour Wave, Orange Money, Free Money et cartes bancaires, avec activation automatique. Exemples : PayDunya (basé au Sénégal, racheté en 2025 par Peach Payments, [source](https://fr.allafrica.com/stories/202504070435.html)), CinetPay, Intouch. Les articles trouvés parlent de documents d'entreprise (NINEA, RCCM, pièce d'identité) : non confirmé par les sites des services, et à vérifier si un statut de particulier est accepté. D'autres acteurs figurent dans la liste citée par la presse sénégalaise (Bictorys, Flutterwave Sénégal, Julaya, Djamo…, [Seneweb](https://www.seneweb.com/fr/news/Economie/mobile-money-pourquoi-le-duel-orange-money-wave-ne-resume-plus-le-marche_n_505004.html)), sans que j'aie vérifié leurs conditions.
3. **Wave Business (API)** : paiement Wave automatique, avec un compte professionnel vérifié (voir la section 6).
4. **Paiement par carte bancaire, y compris depuis l'Europe** : via un « marchand officiel » (Merchant of Record) comme [Polar](https://polar.sh/docs/merchant-of-record/supported-countries) : la plateforme encaisse les cartes, gère les taxes de vente internationales et verse l'argent par Stripe Connect Express. Le Sénégal figure dans sa liste de pays de versement ; un particulier peut être accepté selon ce que Stripe autorise dans le pays (à vérifier). D'autres services du même type existent (Lemon Squeezy, Paddle, Dodo Payments), non vérifiés ici.
5. **À éviter comme moyen principal** : Stripe seul, qui n'ouvre pas directement de compte aux vendeurs établis au Sénégal d'après les sources trouvées ([blog d'agence](https://kolonell.com/en/blog/stripe-senegal-accept-international-cards-2026) et listes de pays tierces, à confirmer sur le site de Stripe) ; PayPal, qui permet de recevoir, mais dont le retrait vers une banque sénégalaise est limité ou complexe d'après les sources trouvées.

**Recommandation** \[Proposition\] : vous encaissez en tant que particulier (confirmé), donc commencer par le paiement manuel (n°1) avec Wave et Orange Money. Les agrégateurs (n°2) et Wave Business (n°3) demandent, d'après les articles trouvés, des documents d'entreprise (NINEA, RCCM) au moins pour encaisser pour de vrai : ils sont probablement hors de portée tant que vous restez particulier. Les cartes (n°4) via un marchand officiel sont à tester si des étudiants paient depuis l'Europe, à condition que Stripe accepte un particulier au Sénégal. Dans tous les cas, le site enregistre pour chaque paiement : montant, moyen, référence, date et fin de validité (1 mois).

**Particulier : points d'attention** \[Proposition\]

- Risque sur votre compte mobile money : d'après un [blog d'agence web](https://kolonell.com/fr/blog/ouvrir-compte-marchand-wave-orange-money-delai-kyc-2026), un opérateur peut limiter ou geler un compte personnel qui reçoit des paiements à caractère commercial, et un agrégateur comme PayDunya permet de tester sans RCCM mais l'exige avant d'activer les vrais encaissements. À vérifier auprès de l'opérateur et du service choisi.
- Pour passer à l'encaissement automatique, il faudra probablement vous formaliser. Le NINEA peut maintenant se demander en ligne ([article](https://www.ndarinfo.com/Formalisation-des-entreprises-Obtenez-votre-NINEA-en-un-clic-sur-E-Senegal_a44018.html), site e-ninea.ansd.sn), et un statut simplifié d'« entreprenant » existe pour les très petites activités (un programme pilote vient d'être lancé pour les artisans, [Le Soleil, 12 novembre 2026](https://fr.allafrica.com/stories/202611120544.html)). Conditions, coûts et obligations fiscales à vérifier auprès des organismes officiels : je ne suis pas juriste.
- Une activité qui encaisse régulièrement des abonnements est une activité commerciale : prévoir de se renseigner sur la déclaration et l'impôt avant le lancement.

### 4.6 Fonctionnalités futures \[Notes\]

- « Pratique » (voir 3.2).
- Formation et Projet : deux fonctionnalités à ajouter, la suite de la ligne est illisible dans les notes. « Projet » figure déjà dans la barre de navigation (voir 4.8), pas « Formation » \[À clarifier\].
- Nouvelles matières : langage C et SQL.

### 4.7 Administration \[Proposition\]

- Importer et mettre à jour les contenus (quiz, TD, rappels de cours).
- Valider ou refuser les inscriptions, gérer les comptes, activer ou retirer des offres, suivre les 10 premiers utilisateurs gratuits.
- Voir les statistiques : utilisateurs, quiz passés, TD rendus, usage de l'IA et son coût.

### 4.8 Navigation du site \[Notes, capture d'écran\]

- Une barre de navigation est déjà créée (capture reçue le 16 novembre 2026) : un bandeau bleu avec le logo à gauche et cinq entrées : **Révision**, **Assistant de révision**, **Rappel de cours**, **Projet**, **Espace étudiant** \[Notes\].
- Lecture proposée \[Proposition\] : Révision = matières, modules, quiz et TD ; Assistant de révision = l'assistant IA ; Rappel de cours = les fiches de synthèse ; Projet = la fonctionnalité prévue en 4.6 ; Espace étudiant = compte, progression, points et offre en cours. À confirmer.
- Emplacement de « Pratique » et de « Formation » \[À clarifier\] : ils ne figurent pas dans la barre.
- Version téléphone \[Proposition\] : cinq entrées ne tiennent pas sur un petit écran. Prévoir un menu replié derrière un bouton ; la capture montre la version ordinateur.
- Nom de la plateforme \[À clarifier\] : il n'est pas lisible sur la capture, le logo y est trop petit.

## 5. Exigences non fonctionnelles \[Proposition\]

- **Mobile d'abord** : l'interface est pensée pour un téléphone, et reste légère pour les connexions lentes.
- **Langue** : français.
- **Sécurité** : HTTPS, mots de passe protégés, limitation des essais de connexion, clé de l'IA jamais visible dans le navigateur.
- **Données personnelles** : les numéros de téléphone sont des données personnelles. Prévoir un consentement, ne collecter que le nécessaire, permettre la suppression du compte, et vérifier la réglementation locale.
- **Coût** : hébergement économique, et budget IA maîtrisé grâce aux quotas.

## 6. Conséquences techniques \[Proposition\]

- Ma recommandation du départ (un site statique sans serveur) ne suffit plus : comptes, paiements, points, quotas de l'IA et déblocage des TD demandent un **serveur et une base de données**.
- Piste de départ : un site web avec une base de données et un système de comptes (par exemple Supabase), le contenu en JSON déjà produit, et l'appel à l'IA fait côté serveur.
- Connexion par numéro et mot de passe : le numéro peut simplement servir d'identifiant. L'envoi automatique de codes par WhatsApp (mot de passe oublié, et éventuellement vérification du numéro) passe par l'API WhatsApp Business de Meta : chaque code est un message « d'authentification » facturé quand il est délivré, la catégorie la moins chère d'après des guides tiers, mais le tarif dépend du pays et je n'ai pas vérifié celui du Sénégal. Il faut aussi un modèle de message approuvé par Meta (\[source\](https://www.suprsend.com/post/whatsapp-otp-notifications)). Les démarches côté Meta (compte Business, numéro dédié) sont à vérifier. Prévoir de limiter le nombre de codes demandés par numéro (par exemple 3 par heure) et leur durée de validité (par exemple 10 minutes) : chaque code coûte de l'argent et pourrait être détourné pour envoyer des messages à des inconnus \[Proposition\].

* **Paiement Wave** \[Proposition\] : deux voies sont possibles. **Manuelle** : l'étudiant paie vers un numéro ou un lien Wave de votre choix, envoie sa référence de paiement, et vous activez son accès à la main. C'est simple, mais lourd chaque mois et exposé aux fausses preuves de paiement. **Automatique** : le site crée un paiement Wave et active l'accès dès que Wave le confirme.
* D'après un article de blog d'agence web, pas la documentation de Wave, l'accès automatique passe par l'API Wave Business, réservée aux comptes professionnels vérifiés (RCCM, NINEA et pièce d'identité du gérant) : un compte personnel n'y donne pas accès ([source](https://kolonell.com/fr/blog/wave-business-api-onboarding-kyc-delais-2026)). À confirmer auprès de Wave.
* Conséquence \[Proposition\] : démarrer avec l'activation manuelle (phase 1), puis passer à l'automatique après votre formalisation, prévue (confirmé), avec un compte Wave Business ou un agrégateur (voir 4.5).

## 7. Phasage proposé \[Proposition\]

- **Phase 1 : base.** Comptes, navigation, quiz, TD, offre gratuite, activation manuelle des accès payants, avec vérification du numéro (par l'administrateur, lors de la validation de l'inscription) et réinitialisation du mot de passe par l'administrateur, en attendant les codes WhatsApp automatiques.
- **Phase 2 : suivi.** Rappels de cours, déblocage des TD après rendu (simple dépôt au début, la vérification par l'IA arrive en phase 3), points et classement, déblocage des modules, codes WhatsApp automatiques.
- **Phase 3 : assistant IA** avec quotas par offre, et vérification des rendus de TD.
- **Phase 4 : extensions.** Paiement automatique (après la formalisation), Pratique, Formation, Projet, langage C et SQL.

## 8. Points à clarifier, par priorité

1. Réserve de questions : les tentatives (3, puis 2 à chaque reprise) reposent sur les mêmes 20 questions par module. Faut-il en écrire davantage ?
2. Calendrier de la formalisation (NINEA, statut d'entreprenant) et choix, ensuite, entre un agrégateur et Wave Business pour le paiement automatique.
3. « Rendre son travail » : critères du « travail sérieux », nombre d'essais et déblocage manuel (le format est fixé : texte, photo ou fichier ; la vérification par l'IA est confirmée).
4. Démarches Meta pour les codes WhatsApp et tarif pour le Sénégal (compte Business, numéro dédié, modèle de message).
5. Barème des points (nombre de points pour chaque action).
6. Accès gratuit des 10 premiers utilisateurs : à quel niveau (équivalent à l'offre à 2 000 F, IA comprise ?), pendant combien de temps (un mois, tout le cycle) et comment les 10 sont-ils comptés ?
7. Budget quotidien global de l'IA (plafond de dépense avant mise en pause).
8. Nom définitif de la plateforme et nombre d'étudiants de la promotion.
9. Qui valide les corrigés de TD : vous seul, ou un enseignant ?
10. Contenu attendu de Pratique, Formation et Projet.

**Ajouts du 16 novembre (paiement et navigation)**

- Statut pour encaisser : particulier (confirmé). Souhaitez-vous vous formaliser (NINEA, statut d'entreprenant) pour accéder au paiement automatique \[À clarifier\] ?
- D'où paieront les étudiants \[À clarifier\] : uniquement depuis le Sénégal, ou aussi depuis l'Europe ?
- Où placer « Pratique » et « Formation » dans la barre de navigation \[À clarifier\] ?
