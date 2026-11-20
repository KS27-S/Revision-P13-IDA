/*
 * services/whatsapp.js
 * Envoi des codes de vérification.
 *
 * Pour l'instant on ne branchera pas l'API WhatsApp Business : la fonction
 * envoyerCodeWhatsApp affiche seulement le code dans la console du serveur.
 * Quand la vraie API sera disponible, on ne modifiera QUE ce fichier : les
 * routes et la base continueront à appeler la même fonction.
 *
 * Pourquoi empreinte du code : on garde SHA-256(code) dans la base. Même si
 * quelqu'un lit la base, il ne voit pas les codes en clair.
 */

const crypto = require("node:crypto");

// randomInt évite les biais de Math.random() : tous les codes ont la même
// probabilité d'apparaître.
function genererCodeVerification() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function hacherCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// Compare deux empreintes sans révéler, par le temps de réponse, sur quelle
// position les chaînes diffèrent.
function comparerCode(code, hache) {
  const attendu = Buffer.from(hacherCode(code), "hex");
  const stocke = Buffer.from(hache, "hex");
  return attendu.length === stocke.length && crypto.timingSafeEqual(attendu, stocke);
}

function envoyerCodeWhatsApp(numero, code) {
  // Mode développement : le code s'affiche dans le terminal qui a lancé
  // npm start. À remplacer par un appel à l'API WhatsApp plus tard.
  console.log(`[WhatsApp - mode test] Code pour ${numero} : ${code}`);

  // On retourne true pour que la route sache que l'envoi s'est bien passé.
  return true;
}

module.exports = {
  genererCodeVerification,
  hacherCode,
  comparerCode,
  envoyerCodeWhatsApp,
};
