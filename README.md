# Revision-P13-IDA

Plateforme de révision IDA P13 : pages HTML/CSS/JS servies par Express, API sous `/api` et base SQLite.

## Local

Node >= 22, `npm install`, copier `.env.example` vers `.env`, puis `npm start` (http://localhost:3000). `npm test` lance les tests.

## Hébergement Vercel (front et API sur le même domaine)

Les pages sont servies depuis `public/` et l'API est une fonction Vercel : `api/index.js` exporte l'application Express et `vercel.json` route `/api/*` vers cette fonction. Sans cette fonction, les pages s'affichent mais `/api/session`, `/api/connexion` et `/api/inscription` répondent 404. Les copies HTML à la racine du dépôt sont d'anciennes versions, non servies par Express.

Variables à définir dans les paramètres du projet Vercel (le fichier `.env` n'est pas versionné) :

| Variable | Rôle |
| --- | --- |
| `SESSION_SECRET` | clé de signature du cookie, aléatoire et d'au moins 16 caractères ; la fonction échoue si elle manque (`server.js:43`) |
| `NODE_ENV=production` | valeur positionnée par Vercel ; active le cookie sécurisé et la confiance au proxy |
| `DB_PATH` | chemin de la base SQLite. Sur Vercel, défaut `/tmp/revision-p13.db` car le système de fichiers du projet est en lecture seule |

Sur Vercel, la base dans `/tmp` est volatile : les comptes disparaissent lors d'un redémarrage de la fonction. Pour une production durable, brancher une base persistante et renseigner `DB_PATH`/la couche d'accès en conséquence.

`COOKIE_SECURE=false` uniquement si l'hébergeur sert le site en HTTP ; préférer HTTPS. `GEMINI_API_KEY` n'est pas utilisé par le code actuel.

Après déploiement, `GET /api/session` doit répondre `{"connecte":false}` et `POST /api/connexion` doit répondre du JSON, depuis le même domaine que les pages.
