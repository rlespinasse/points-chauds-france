# Endpoints API

APIs tierces et services de tuiles utilisés par Points Chauds France.

## NASA FIRMS (détections de feux/points chauds)

**Endpoint :** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/{source}/{area}/{day_range}[/{date}]`

**Utilisé pour :** les données de détection de feux/points chauds (VIIRS),
récupérées par `scripts/fetch-firms.mjs`.

**Sources interrogées (une requête par satellite) :**

- `VIIRS_SNPP_NRT` (Suomi NPP)
- `VIIRS_NOAA20_NRT` (NOAA-20)
- `VIIRS_NOAA21_NRT` (NOAA-21)

**Authentification :** `map_key` gratuite — voir
[configurer-la-cle-firms.md](../guides/configurer-la-cle-firms.md)

**Fenêtre :** plafonnée à 5 jours par requête (`day_range`) ; le segment
optionnel final `date` permet de faire terminer une requête à une date
passée plutôt qu'aujourd'hui, utilisé pour le backfill de l'archive

**Réponse :** CSV, converti en GeoJSON par `csvToGeoJSON()` dans
`scripts/fetch-firms.mjs`. Les champs utilisés incluent latitude/longitude,
`brightness`, `frp` (Fire Radiative Power), `acq_date`, `acq_time`,
`confidence` et le nom du satellite/de la source.

## geo.api.gouv.fr (géocodage inverse)

**Endpoint :** `https://geo.api.gouv.fr/communes/`

**Utilisé pour :** résoudre les coordonnées de chaque détection vers une
commune française, via une véritable recherche point-in-polygon (préférée
au géocodage d'adresse BAN, qui échoue pour les points isolés sans bâtiment
à proximité — exactement le type de point qui intéresse une carte de points
chauds).

**Authentification :** aucune requise

**Mise en cache :** les résultats sont mis en cache localement dans
`data/commune-cache.json` (indexés par coordonnées arrondies, rétention de
30 jours) afin d'éviter de re-géocoder les mêmes points à chaque exécution
toutes les 3 heures.

Les points hors de France (la boîte englobante de FIRMS couvre aussi des
parties de la Belgique, de la Suisse, de l'Espagne et de l'Italie) qui ne
résolvent pas vers une commune française sont écartés.

## OpenStreetMap (tuiles de fond de carte)

**Endpoint :** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`

**Utilisé pour :** la couche de fond par défaut, configurée dans
`src/config.ts` (`baseLayers.OpenStreetMap`). © contributeurs OpenStreetMap,
ODbL.

## Esri ArcGIS World Imagery (couche de fond satellite)

**Endpoint :** `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

**Utilisé pour :** la couche de fond satellite optionnelle, configurée dans
`src/config.ts` (`baseLayers.Satellite`). © Esri.

## GoatCounter (analytics)

**Endpoint :** `https://rlespinasse.goatcounter.com/count`

**Utilisé pour :** une mesure d'audience respectueuse de la vie privée, sans
cookies. Chargé via `count.js` dans `index.html` ; le préfixage des
événements est configuré dans `src/analytics.ts` et consommé par
`leaflet-atlas` (voir [architecture.md](../explications/architecture.md)).
