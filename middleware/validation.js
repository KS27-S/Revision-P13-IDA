/*
 * middleware/validation.js
 * Petites fonctions de validation utilisées à la fois par les routes API et
 * par le script de création de l'administrateur.
 *
 * Pourquoi valider côté serveur : le navigateur peut être contourné (on peut
 * envoyer une requête directement avec curl). La validation JavaScript du front
 * sert au confort, celle du serveur est la seule qui compte.
 */

// Longueurs choisies pour rester raisonnables et éviter les textes démesurés.
const LONGUEUR_PSEUDO = { minimum: 2, maximum: 50 };
const LONGUEUR_MOT_DE_PASSE = { minimum: 8, maximum: 100 };

// Nettoie un numéro de téléphone et le met toujours sous la forme +221...
function nettoyerNumero(valeur) {
  if (typeof valeur !== "string") {
    return "";
  }

  const brut = valeur.trim();

  // On refuse les lettres et les caractères bizarres avant de nettoyer.
  if (!/^\+?[0-9\s().-]+$/.test(brut)) {
    return "";
  }

  const chiffres = brut.replace(/\D/g, "");

  // Le format international accepte de 9 à 15 chiffres (norme E.164).
  if (chiffres.length < 9 || chiffres.length > 15) {
    return "";
  }

  return `+${chiffres}`;
}

function validerInscription(corps) {
  const erreurs = [];
  const pseudo = typeof corps.pseudo === "string" ? corps.pseudo.trim() : "";
  const whatsapp = nettoyerNumero(corps.whatsapp);
  const motDePasse =
    typeof corps.mot_de_passe === "string" ? corps.mot_de_passe : "";

  if (
    pseudo.length < LONGUEUR_PSEUDO.minimum ||
    pseudo.length > LONGUEUR_PSEUDO.maximum
  ) {
    erreurs.push("Le pseudo doit contenir entre 2 et 50 caractères.");
  }

  if (!whatsapp) {
    erreurs.push("Le numéro WhatsApp est invalide.");
  }

  if (
    motDePasse.length < LONGUEUR_MOT_DE_PASSE.minimum ||
    motDePasse.length > LONGUEUR_MOT_DE_PASSE.maximum
  ) {
    erreurs.push("Le mot de passe doit contenir entre 8 et 100 caractères.");
  }

  return {
    valide: erreurs.length === 0,
    erreurs,
    donnees: { pseudo, whatsapp, motDePasse },
  };
}

function validerConnexion(corps) {
  const whatsapp = nettoyerNumero(corps.whatsapp);
  const motDePasse =
    typeof corps.mot_de_passe === "string" ? corps.mot_de_passe : "";

  // On ne précise pas la longueur attendue : un message générique évite de
  // révéler si le numéro existe ou si le mot de passe est presque correct.
  if (!whatsapp || !motDePasse) {
    return { valide: false };
  }

  return { valide: true, donnees: { whatsapp, motDePasse } };
}

function validerCode(corps) {
  const whatsapp = nettoyerNumero(corps.whatsapp);
  const code = typeof corps.code === "string" ? corps.code.trim() : "";

  if (!whatsapp || !/^\d{6}$/.test(code)) {
    return { valide: false };
  }

  return { valide: true, donnees: { whatsapp, code } };
}

function validerIdentifiant(valeur) {
  const texte = String(valeur);
  if (!/^\d+$/.test(texte) || Number(texte) < 1) {
    return null;
  }
  return Number(texte);
}

/*
 * Durée d'un abonnement, choisie par l'administrateur. Le cahier prévoit une
 * offre valable 1 mois ; on autorise jusqu'à 12 mois pour un paiement fait
 * d'avance, mais jamais zéro ni une valeur bizarre envoyée par le navigateur.
 */
function validerDureeMois(valeur) {
  const nombre = Number(valeur);
  if (!Number.isInteger(nombre) || nombre < 1 || nombre > 12) {
    return null;
  }
  return nombre;
}

module.exports = {
  nettoyerNumero,
  validerInscription,
  validerConnexion,
  validerCode,
  validerIdentifiant,
  validerDureeMois,
};
