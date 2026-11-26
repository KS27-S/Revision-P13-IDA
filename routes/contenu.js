/*
 * routes/contenu.js
 * Petites APIs de lecture utilisées par les pages : la liste des offres et
 * l'état (disponible / verrouillé) des modules de revision.html.
 *
 * Aucun contenu payant n'est envoyé ici : ce sont uniquement des informations
 * publiques ou des réponses calculées par peutAcceder côté serveur.
 */

const express = require("express");
const base = require("../db/connexion");
const { peutAcceder } = require("../services/acces");
const {
  ajouterEtatsProgression,
} = require("../services/progression");

const router = express.Router();

// Les offres sont affichées quand un accès est refusé ("proposition de
// s'abonner") et peuvent aussi servir plus tard sur la page des offres.
router.get("/offres", (req, res) => {
  try {
    const offres = base
      .prepare(
        `SELECT id, slug, nom, prix_fcfa, duree_mois, inclut_quiz, inclut_rappel,
                inclut_td, messages_ia_par_jour
         FROM offres ORDER BY prix_fcfa`
      )
      .all();
    return res.json({ offres });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

/*
 * revision.html possède déjà ses 8 cartes et ses 37 lignes de modules en HTML.
 * Cette route ne remplace pas le HTML : elle fournit seulement l'état de chaque
 * module. Le front se contente de recopier cette réponse dans data-etat.
 *
 * On teste le type "quiz" car la page Révision mène aux quiz/TD. Les rappels ont
 * leur propre contrôle dans /api/rappels (une offre à 500 F n'inclut pas les
 * rappels, mais inclut les quiz).
 */
router.get("/modules-etats", (req, res) => {
  try {
    const modules = base
      .prepare(
        `SELECT m.id, m.slug, m.titre, m.offert, m.matiere_id, m.ordre_affichage,
                mat.slug AS matiere_slug
         FROM modules m JOIN matieres mat ON mat.id = m.matiere_id
         ORDER BY mat.ordre_affichage, m.ordre_affichage`
      )
      .all();

    const etats = ajouterEtatsProgression(
      base,
      req.utilisateur,
      modules
    ).map(function (module) {
      const acces = peutAcceder(req.utilisateur, module, "quiz");
      return {
        id: module.id,
        matiereSlug: module.matiere_slug,
        moduleSlug: module.slug,
        offert: Boolean(module.offert),
        // "etat" garde son ancien sens (offre/abonnement) pour ne rien casser.
        etat: acces.autorise ? "disponible" : "verrouille",
        // "debloque" ajoute la progression demandée par le cahier.
        debloque: module.debloque,
        progressionRaison: module.progressionRaison,
        meilleurScore: module.meilleurScore,
      };
    });

    return res.json({ modules: etats });
  } catch (erreur) {
    return res.status(500).json({ erreur: "Erreur interne du serveur." });
  }
});

module.exports = router;
