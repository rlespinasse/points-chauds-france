/**
 * leaflet-atlas config for Points chauds France — layers, styles, tooltips,
 * detail panels, and the "About" legal page. See README.md for the pipeline
 * that produces the GeoJSON files referenced below.
 */

import { analyticsConfig } from './analytics'

// Fire Radiative Power (MW) color scale — shared by layer styles below
// and by the on-map legend built in main.ts. `max` mirrors FRP_BUCKETS in
// scripts/fetch-firms.mjs (intentional duplicate — that script runs outside
// the Vite/TS pipeline) and is used by frpBucketId() to classify archive
// features, which arrive unsplit unlike the live pre-bucketed files.
export const frpScale = [
  { id: 'faible', label: '< 5 MW (faible)', color: '#fde047', stroke: '#854d0e', max: 5 },
  { id: 'moderee', label: '5–20 MW (modérée)', color: '#f97316', stroke: '#7c2d12', max: 20 },
  { id: 'forte', label: '≥ 20 MW (forte)', color: '#b91c1c', stroke: '#450a0a', max: Infinity },
]

// Classifies a raw FRP value into one of frpScale's bucket ids.
export function frpBucketId(frp: number) {
  const value = Number.isFinite(frp) ? frp : 0
  for (const bucket of frpScale) {
    if (value < bucket.max) return bucket.id
  }
  return frpScale[frpScale.length - 1].id
}

// Raw FIRMS codes are not human-readable — translate them for tooltips/details.
const SATELLITE_LABELS: Record<string, string> = { N: 'Suomi NPP', N20: 'NOAA-20', N21: 'NOAA-21' }
const CONFIDENCE_LABELS: Record<string, string> = { l: 'Faible', n: 'Nominale', h: 'Élevée' }
const DAYNIGHT_LABELS: Record<string, string> = { D: 'Jour', N: 'Nuit' }

const PARIS_DATETIME_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const PARIS_TIME_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// FIRMS gives acq_date/acq_time in UTC — combine them into a UTC Date.
// Exported so src/main.ts's time slider can bucket hotspots by Paris-local
// day without duplicating this parsing.
export function acqDateTimeToUtcDate(acqDate: string | undefined, acqTime: string | undefined) {
  if (!acqDate || !acqTime) return null
  const padded = acqTime.padStart(4, '0')
  const utcDate = new Date(`${acqDate}T${padded.slice(0, 2)}:${padded.slice(2)}:00Z`)
  return Number.isNaN(utcDate.getTime()) ? null : utcDate
}

// Europe/Paris local date (handles CET/CEST) as 'YYYY-MM-DD'.
export function parisDateString(date: Date) {
  const parts = Object.fromEntries(
    PARIS_DATETIME_FORMAT.formatToParts(date).map((p) => [p.type, p.value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

// Minutes since Europe/Paris-local midnight — lets src/main.ts's time slider
// compare "has this time of day already happened today" between a hotspot's
// detection time and the current moment, regardless of CET/CEST.
export function parisMinutesOfDay(date: Date) {
  const parts = Object.fromEntries(
    PARIS_TIME_FORMAT.formatToParts(date).map((p) => [p.type, p.value])
  )
  return Number(parts.hour) * 60 + Number(parts.minute)
}

function toParisDateTime(acqDate: string | undefined, acqTime: string | undefined) {
  const utcDate = acqDateTimeToUtcDate(acqDate, acqTime)
  if (!utcDate) return null

  const parts = Object.fromEntries(
    PARIS_DATETIME_FORMAT.formatToParts(utcDate).map((p) => [p.type, p.value])
  )
  return {
    date: parisDateString(utcDate),
    time: `${parts.hour}:${parts.minute}`,
  }
}

function formatParis(acqDate: string | undefined, acqTime: string | undefined) {
  const parisDateTime = toParisDateTime(acqDate, acqTime)
  return parisDateTime ? `${parisDateTime.date} ${parisDateTime.time}` : 'N/A'
}

const firmsTooltip = (properties: any) => {
  const lieu = properties.commune
    ? `${properties.commune} (${properties.departement || 'N/A'})`
    : 'Localisation inconnue'
  return `<strong>${lieu}</strong><br>${formatParis(properties.acq_date, properties.acq_time)}<br>FRP : ${properties.frp || 'N/A'} MW`
}

const firmsDetail = (properties: any) => `
  <h2>${properties.commune || 'Point chaud détecté par satellite'}</h2>
  <dl>
    <dt>Commune</dt><dd>${properties.commune || 'N/A'}</dd>
    <dt>Code INSEE</dt><dd>${properties.code_insee || 'N/A'}</dd>
    <dt>Département</dt><dd>${properties.departement || 'N/A'}</dd>
    <dt>Région</dt><dd>${properties.region || 'N/A'}</dd>
    <dt>Date et heure</dt><dd>${formatParis(properties.acq_date, properties.acq_time)} (heure de Paris)</dd>
    <dt>Satellite</dt><dd>${SATELLITE_LABELS[properties.satellite] || properties.satellite || 'N/A'}</dd>
    <dt>Confiance de détection</dt><dd>${CONFIDENCE_LABELS[properties.confidence] || properties.confidence || 'N/A'}</dd>
    <dt>Puissance radiative (FRP)</dt><dd>${properties.frp || 'N/A'} MW</dd>
    <dt>Jour/Nuit</dt><dd>${DAYNIGHT_LABELS[properties.daynight] || properties.daynight || 'N/A'}</dd>
  </dl>
`

const firmsSearch = {
  title: (p: any) => p.commune || 'Point chaud',
  text: ['commune', 'departement', 'region', 'code_insee'],
  meta: (p: any) => [p.departement, p.acq_date].filter(Boolean).join(' · '),
}

const communesTooltip = (properties: any) => {
  const count = properties.hotspot_count || 0
  return `<strong>${properties.nom || 'Commune'}</strong><br>${count} point${count > 1 ? 's' : ''} chaud${count > 1 ? 's' : ''}`
}

const communesDetail = (properties: any) => `
  <h2>${properties.nom || 'Commune'}</h2>
  <dl>
    <dt>Code INSEE</dt><dd>${properties.code || 'N/A'}</dd>
    <dt>Département</dt><dd>${properties.departement?.nom || 'N/A'}</dd>
    <dt>Région</dt><dd>${properties.region?.nom || 'N/A'}</dd>
    <dt>Points chauds (5 jours)</dt><dd>${properties.hotspot_count || 0}</dd>
  </dl>
`

export const config = {
  // ============= MAP ============= //
  map: {
    elementId: 'map',           // HTML element ID where map mounts
    center: [46.6, 2.5],        // Initial center [lat, lng]
    zoom: 6,                    // Initial zoom level
  },

  // ============= TITLE ============= //
  title: {
    heading: 'Points chauds en France',
    subtitle: 'Détections satellite quasi temps réel (NASA FIRMS)',
    icon: 'favicon.svg',
  },

  // ============= BASE LAYERS (Tile services) ============= //
  baseLayers: {
    'OpenStreetMap': {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      },
    },
    'Satellite': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        attribution: '© Esri',
        maxZoom: 18,
      },
    },
  },
  defaultBaseLayer: 'OpenStreetMap',

  // ============= DATA LAYERS ============= //
  layerGroups: [
    {
      group: 'Temps réel — puissance radiative (FRP)',
      layers: frpScale.map((bucket) => ({
        id: `firms_${bucket.id}`,
        label: bucket.label,
        file: `data/firms-france-${bucket.id}.geojson`,
        active: true,
      })),
    },
  ],

  // ============= ARCHIVE (older-than-5-day history, lazily fetched by the time slider) ============= //
  archive: {
    indexFile: 'data/archive/index.json',
    dayFile: (date: string) => `data/archive/${date}.geojson`,
  },

  // ============= CONTEXT LAYERS (background reference, own "Contexte" section) ============= //
  contextLayers: [
    {
      id: 'communes_context',
      label: 'Communes avec points chauds',
      file: 'data/communes-context.geojson',
      active: true,
    },
  ],

  // ============= GEOMETRY TYPES ============= //
  // leaflet-atlas auto-assigns each layer's stacking pane from this — points
  // always go above polygons. Without it, FRP hotspots (Point geometries)
  // fall back to the default 'polygon' auto-pane logic, which can't compute
  // an area for points and silently skips assigning them a pane — leaving
  // them on the default overlay pane, *below* communes_context's polygon
  // pane and unclickable.
  geometryTypes: {
    ...Object.fromEntries(frpScale.map((bucket) => [`firms_${bucket.id}`, 'point'])),
    communes_context: 'polygon',
  },

  // ============= SEARCH ============= //
  searchableProps: Object.fromEntries(
    frpScale.map((bucket) => [`firms_${bucket.id}`, firmsSearch])
  ),

  // ============= STYLES ============= //
  styles: {
    ...Object.fromEntries(
      frpScale.map((bucket) => [
        `firms_${bucket.id}`,
        { radius: 6, color: bucket.stroke, weight: 1, fillColor: bucket.color, fillOpacity: 0.85 },
      ])
    ),
    communes_context: {
      color: '#1f2937',
      weight: 1.5,
      opacity: 0.6,
      fill: true,
      fillColor: '#1f2937',
      fillOpacity: 0.05,
    },
  },

  // ============= TOOLTIPS (Hover) ============= //
  tooltips: {
    ...Object.fromEntries(frpScale.map((bucket) => [`firms_${bucket.id}`, firmsTooltip])),
    communes_context: communesTooltip,
  },

  // ============= DETAIL BUILDERS (Click to view details) ============= //
  detailBuilders: () => ({
    ...Object.fromEntries(frpScale.map((bucket) => [`firms_${bucket.id}`, firmsDetail])),
    communes_context: communesDetail,
  }),

  // ============= LEGAL PAGES (About, Data sources, etc.) ============= //
  legalPages: [
    {
      id: 'about',
      label: 'À propos',
      content: `
        <h2>À propos de cet atlas</h2>
        <p>Cet atlas visualise les points chauds détectés par satellite en France à partir de données ouvertes.</p>
        <h3>Sources de données</h3>
        <ul>
          <li>
            Points chauds (temps quasi réel) : détections satellite VIIRS (Suomi NPP, NOAA-20, NOAA-21) via
            <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank">NASA FIRMS</a>
            (LANCE, NASA GSFC), fenêtre glissante de 5 jours (maximum autorisé par l'API FIRMS pour une
            seule requête). Chaque satellite ne survole une même zone qu'environ 2 fois par jour
            (orbite polaire) — combiner les 3 satellites donne ~5-6 passages/jour.
            Le curseur en bas de carte permet de rejouer les 5 derniers jours, journée par journée.
            Ce sont des détections thermiques brutes, pas des incendies confirmés : elles incluent
            aussi bien des feux de végétation que des sources de chaleur industrielles, agricoles, etc.
            Pour la journée en cours, les heures pas encore atteintes affichent les points de la
            veille à la même heure (en attendant les prochains passages satellite), remplacés
            progressivement par les vraies détections du jour.
          </li>
          <li>
            Commune / département / région : point-in-polygon via
            <a href="https://geo.api.gouv.fr/" target="_blank">geo.api.gouv.fr</a> (Etalab).
          </li>
        </ul>
        <h3>Lecture des données</h3>
        <ul>
          <li><strong>Puissance radiative (FRP)</strong> : énergie dégagée par le foyer détecté, en mégawatts. Sert de proxy pour l'intensité du feu — voir la légende sur la carte.</li>
          <li><strong>Confiance de détection</strong> : fiabilité de la détection satellite (faible/nominale/élevée), pas l'intensité du feu.</li>
          <li>Chaque point est une détection satellite ponctuelle, pas un contour de feu : plusieurs points proches peuvent correspondre au même incendie.</li>
          <li>VIIRS a une résolution d'environ 375 m : la position exacte d'un point chaud peut être décalée de quelques centaines de mètres par rapport au foyer réel.</li>
        </ul>
      `,
    },
    {
      id: 'mentions',
      label: 'Mentions légales',
      content: `
        <h2>Mentions légales</h2>
        <h3>Éditeur</h3>
        <p>Points chauds France est un projet personnel et open source édité par Romain Lespinasse.</p>
        <p>
          Code source et contact&nbsp;:
          <a href="https://github.com/rlespinasse/points-chauds-france" target="_blank" rel="noopener">github.com/rlespinasse/points-chauds-france</a>
          (signalements via les <em>issues</em> du dépôt).
        </p>
        <h3>Hébergement</h3>
        <p>
          Site hébergé par GitHub&nbsp;Pages — GitHub,&nbsp;Inc.,
          88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.
        </p>
        <h3>Propriété intellectuelle</h3>
        <p>
          Le code de Points chauds France est distribué sous licence MIT. Les données de détection
          satellite et de découpage administratif affichées restent la propriété de leurs
          producteurs respectifs (voir l'onglet «&nbsp;Données &amp; licences&nbsp;»).
        </p>`,
    },
    {
      id: 'donnees',
      label: 'Données & licences',
      content: `
        <h2>Données &amp; licences</h2>
        <h3>Points chauds (détections satellite)</h3>
        <p>
          Détections thermiques VIIRS (Suomi&nbsp;NPP, NOAA-20, NOAA-21) fournies par
          <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noopener">NASA FIRMS</a>
          (LANCE, NASA GSFC), fenêtre glissante de 5&nbsp;jours.
        </p>
        <h3>Commune / département / région</h3>
        <p>
          Rattachement de chaque point chaud à sa commune obtenu par géolocalisation inversée via
          <a href="https://geo.api.gouv.fr/" target="_blank" rel="noopener">geo.api.gouv.fr</a>
          (Etalab), sous
          <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" target="_blank" rel="noopener">Licence Ouverte 2.0</a>.
        </p>
        <h3>Fond cartographique</h3>
        <p>
          © les contributeurs
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>,
          sous licence ODbL. Fond satellite&nbsp;: © Esri.
        </p>
        <h3>Cartographie</h3>
        <p>
          Réalisée avec <a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a>
          et <a href="https://github.com/rlespinasse/leaflet-atlas" target="_blank" rel="noopener">leaflet-atlas</a>.
        </p>`,
    },
    {
      id: 'confidentialite',
      label: 'Confidentialité',
      content: `
        <h2>Confidentialité</h2>
        <p>
          Points chauds France est un site statique qui mesure son audience avec
          <a href="https://www.goatcounter.com/" target="_blank" rel="noopener">GoatCounter</a>,
          un outil respectueux de la vie privée&nbsp;: aucune donnée personnelle n'est
          collectée, aucun cookie n'est déposé et votre adresse IP n'est pas conservée.
          Les statistiques recueillies (vues de page, événements d'usage, navigateur,
          provenance) sont anonymes et agrégées. Les requêtes émises depuis un poste
          local de développement ne sont pas comptabilisées.
        </p>
        <p>
          Vos préférences d'affichage (couches actives, position de la carte) sont
          encodées dans l'URL de la page (fragment <em>#…</em>) pour permettre le partage
          d'une vue précise&nbsp;: elles ne sont jamais transmises à un serveur.
        </p>
        <p>
          L'affichage de la carte nécessite des requêtes vers des serveurs tiers
          (tuiles OpenStreetMap ou Esri) susceptibles de journaliser votre
          adresse IP selon leurs propres politiques de confidentialité.
        </p>`,
    },
  ],

  // ============= ANALYTICS ============= //
  // See src/analytics.ts for the shared config and the /points-chauds-france
  // event prefix.
  analytics: analyticsConfig,
}
