// Mesure d'audience GoatCounter (compte personnel « rlespinasse »).
//
// `basePath` préfixe TOUS les événements par « /points-chauds-france » — le
// compte GoatCounter peut héberger plusieurs projets, ce préfixe les
// cloisonne. Les vues de page portent déjà ce préfixe (le site est servi sous
// /points-chauds-france/ sur GitHub Pages, cf. vite.config.js).
//
// leaflet-atlas instancie le tracker lui-même à partir de cette config
// (config.analytics dans config.ts) et émet seul les événements natifs
// (couche activée, recherche, zoom, panneau, légal…).
//
// Les hits depuis localhost sont ignorés (garde `isLocalhost` de
// leaflet-atlas + comportement par défaut de count.js, `allow_local` non
// activé).
export const analyticsConfig = {
  provider: 'goatcounter',
  basePath: '/points-chauds-france/',
}
