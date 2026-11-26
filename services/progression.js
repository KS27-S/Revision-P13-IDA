/*
 * services/progression.js
 * Gère le déblocage des modules, un par un, dans chaque matière.
 *
 * Le cahier dit que chaque matière a sa propre suite de modules et que le
 * module suivant s'ouvre quand le quiz précédent est validé (4.4). Le score
 * entre 50 % et 70 % valide le module mais est signalé "à revoir".
 *
 * Ce service ne décide PAS de l'accès par offre : peutAcceder() reste la
 * première barrière, comme demandé. Ici on ajoute seulement la progression.
 */

// Retrouve un module à partir des deux slugs de l'URL (matière + module).
function obtenirModuleParSlugs(base, matiereSlug, moduleSlug) {
  return base
    .prepare(
      `SELECT m.id, m.slug, m.titre, m.offert, m.ordre_affichage,
              mat.id AS matiere_id, mat.slug AS matiere_slug,
              mat.nom AS matiere_nom
       FROM modules m JOIN matieres mat ON mat.id = m.matiere_id
       WHERE mat.slug = ? AND m.slug = ?`
    )
    .get(matiereSlug, moduleSlug);
}

function modulePrecedent(base, module) {
  return base
    .prepare(
      `SELECT id, slug, titre FROM modules
       WHERE matiere_id = ? AND ordre_affichage < ?
       ORDER BY ordre_affichage DESC LIMIT 1`
    )
    .get(module.matiere_id, module.ordre_affichage);
}

// Un module est validé dès qu'une tentative a atteint 10/20. On garde le
// meilleur score de toutes les tentatives, jamais seulement la dernière.
function meilleurScore(base, utilisateurId, moduleId) {
  const ligne = base
    .prepare(
      `SELECT MAX(score) AS meilleur FROM tentatives_quiz
       WHERE utilisateur_id = ? AND module_id = ? AND score IS NOT NULL`
    )
    .get(utilisateurId, moduleId);
  return ligne.meilleur === null ? null : ligne.meilleur;
}

function estModuleValide(base, utilisateurId, moduleId) {
  const ligne = base
    .prepare(
      `SELECT 1 FROM tentatives_quiz
       WHERE utilisateur_id = ? AND module_id = ? AND valide_module = 1 LIMIT 1`
    )
    .get(utilisateurId, moduleId);
  return Boolean(ligne);
}

/*
 * Renvoie { autorise, raison }. Le premier module d'une matière est toujours
 * débloqué ; les suivants exigent que le quiz précédent ait été validé.
 */
function verifierProgression(base, utilisateur, module) {
  if (!utilisateur) {
    return { autorise: false, raison: "Connectez-vous pour accéder à ce contenu." };
  }

  const precedent = modulePrecedent(base, module);
  if (!precedent) {
    return { autorise: true, raison: "Premier module de la matière." };
  }

  if (estModuleValide(base, utilisateur.id, precedent.id)) {
    return { autorise: true, raison: "Module précédent validé." };
  }

  return {
    autorise: false,
    raison: `Terminez le quiz du module précédent (${precedent.titre}) pour débloquer celui-ci.`,
    modulePrecedent: precedent.slug,
  };
}

/*
 * Complète la liste utilisée par /api/modules-etats sans changer la clé
 * "etat" existante (abonnement/offre) : on ajoute "debloque" et le détail de
 * progression. Ainsi les anciens tests et l'ancien front restent valides.
 */
function ajouterEtatsProgression(base, utilisateur, modules) {
  return modules.map(function (module) {
    const progression = verifierProgression(base, utilisateur, module);
    return {
      ...module,
      debloque: progression.autorise,
      progressionRaison: progression.autorise ? "" : progression.raison,
      meilleurScore: utilisateur
        ? meilleurScore(base, utilisateur.id, module.id)
        : null,
    };
  });
}

module.exports = {
  obtenirModuleParSlugs,
  modulePrecedent,
  meilleurScore,
  estModuleValide,
  verifierProgression,
  ajouterEtatsProgression,
};
