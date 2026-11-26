/*
 * services/abonnements.js
 * Tout ce qui concerne la durée des abonnements : calcul des dates, expiration
 * automatique, abonnement en cours et historique.
 *
 * Pourquoi un service séparé : la règle "un abonnement expire à sa date de fin"
 * doit être appliquée partout de la même façon (API rappels, espace étudiant,
 * admin). En la mettant ici, on ne la recopie pas dans chaque route.
 */

const base = require("../db/connexion");

// SQLite stocke les dates sous la forme "AAAA-MM-JJ HH:MM:SS" en UTC. On garde
// exactement ce format pour pouvoir comparer les dates directement en SQL.
const FORMAT_DATE = "YYYY-MM-DD HH:MM:SS";

function enTexteDate(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function enDate(texte) {
  // Le "Z" précise à JavaScript que l'heure est déjà en UTC (et non locale).
  return new Date(String(texte).replace(" ", "T") + "Z");
}

// Ajoute un nombre de mois à une date. Le cahier prévoit 1 mois par offre ;
// l'administrateur peut accorder plusieurs mois d'un coup depuis le formulaire.
function ajouterMois(texteDate, nombreMois) {
  const date = enDate(texteDate);
  date.setUTCMonth(date.getUTCMonth() + nombreMois);
  return enTexteDate(date);
}

// Date du jour au format SQLite.
function maintenant() {
  return enTexteDate(new Date());
}

/*
 * Expiration automatique : on ne supprime rien, on change seulement le statut.
 * L'historique reste donc intact. Cette fonction est appelée au démarrage du
 * serveur, toutes les heures, et avant chaque lecture d'abonnement actif.
 */
function mettreAJourAbonnementsExpires() {
  return base
    .prepare(
      `UPDATE abonnements SET statut = 'expire'
       WHERE statut = 'actif' AND date_fin <= ?`
    )
    .run(maintenant()).changes;
}

// Renvoie l'abonnement en cours d'un utilisateur, avec les détails de l'offre.
function obtenirAbonnementActif(utilisateurId) {
  mettreAJourAbonnementsExpires();
  return (
    base
      .prepare(
        `SELECT a.id, a.utilisateur_id, a.offre_id, a.date_debut, a.date_fin,
                a.statut, a.reference_paiement,
                o.slug AS offre_slug, o.nom AS offre_nom, o.prix_fcfa,
                o.inclut_quiz, o.inclut_rappel, o.inclut_td,
                o.messages_ia_par_jour
         FROM abonnements a JOIN offres o ON o.id = a.offre_id
         WHERE a.utilisateur_id = ? AND a.statut = 'actif'
         ORDER BY a.date_fin DESC, a.id DESC
         LIMIT 1`
      )
      .get(utilisateurId) || null
  );
}

// Tout les abonnements d'un utilisateur, du plus récent au plus ancien.
function obtenirHistorique(utilisateurId) {
  return base
    .prepare(
      `SELECT a.id, a.date_debut, a.date_fin, a.statut, a.reference_paiement,
              o.nom AS offre_nom
       FROM abonnements a JOIN offres o ON o.id = a.offre_id
       WHERE a.utilisateur_id = ?
       ORDER BY a.date_debut DESC, a.id DESC`
    )
    .all(utilisateurId);
}

/*
 * Active un nouvel abonnement. L'ancien abonnement actif passe au statut
 * "remplace" : il reste visible dans l'historique mais n'ouvre plus l'accès.
 * "dateDebut" peut être dans le futur (cas d'une prolongation).
 */
function creerAbonnement(utilisateurId, offreId, dureeMois, referencePaiement, dateDebut) {
  let debut = dateDebut || maintenant();

  // Transaction : on ne doit jamais se retrouver avec deux abonnements actifs
  // si une erreur survient entre les deux requêtes.
  const operation = base.transaction(() => {
    base
      .prepare(
        "UPDATE abonnements SET statut = 'remplace' WHERE utilisateur_id = ? AND statut = 'actif'"
      )
      .run(utilisateurId);

    const information = base
      .prepare(
        `INSERT INTO abonnements
           (utilisateur_id, offre_id, date_debut, date_fin, statut, reference_paiement)
         VALUES (?, ?, ?, ?, 'actif', ?)`
      )
      .run(
        utilisateurId,
        offreId,
        debut,
        ajouterMois(debut, dureeMois),
        referencePaiement || null
      );

    return Number(information.lastInsertRowid);
  });

  return operation();
}

/*
 * Prolonge un abonnement : on repart de sa date de fin si elle est encore dans
 * le futur, sinon de maintenant. On crée une nouvelle ligne (et non une simple
 * mise à jour) pour que l'historique montre la prolongation.
 */
function prolongerAbonnement(abonnementId, dureeMois) {
  const ancien = base
    .prepare("SELECT * FROM abonnements WHERE id = ?")
    .get(abonnementId);
  if (!ancien) {
    return null;
  }

  const maintenantTexte = maintenant();
  const debut = ancien.date_fin > maintenantTexte ? ancien.date_fin : maintenantTexte;
  const nouvelId = creerAbonnement(
    ancien.utilisateur_id,
    ancien.offre_id,
    dureeMois,
    ancien.reference_paiement,
    debut
  );
  return nouvelId;
}

// Nombre de jours entiers avant la fin. S'il reste moins d'un jour, on affiche 0.
function joursRestants(dateFin) {
  const difference = enDate(dateFin).getTime() - Date.now();
  return Math.max(0, Math.floor(difference / (24 * 60 * 60 * 1000)));
}

module.exports = {
  FORMAT_DATE,
  enTexteDate,
  ajouterMois,
  maintenant,
  mettreAJourAbonnementsExpires,
  obtenirAbonnementActif,
  obtenirHistorique,
  creerAbonnement,
  prolongerAbonnement,
  joursRestants,
};
