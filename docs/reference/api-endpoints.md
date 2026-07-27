# API Endpoints

Third-party APIs and tile services used by Points Chauds France.

## NASA FIRMS (fire/hotspot detections)

**Endpoint:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/{source}/{area}/{day_range}[/{date}]`

**Used for:** Fire/hotspot detection data (VIIRS), fetched by
`scripts/fetch-firms.mjs`.

**Sources queried (one request per satellite):**

- `VIIRS_SNPP_NRT` (Suomi NPP)
- `VIIRS_NOAA20_NRT` (NOAA-20)
- `VIIRS_NOAA21_NRT` (NOAA-21)

**Authentication:** free `map_key` — see
[setup-firms-key.md](../how-to/setup-firms-key.md)

**Window:** capped at 5 days per request (`day_range`); the optional
trailing `date` segment lets a request end on a past date instead of today,
used for backfilling the archive

**Response:** CSV, parsed into GeoJSON by `csvToGeoJSON()` in
`scripts/fetch-firms.mjs`. Fields used include latitude/longitude,
brightness, `frp` (Fire Radiative Power), `acq_date`, `acq_time`,
`confidence` and satellite/source name.

## geo.api.gouv.fr (reverse geocoding)

**Endpoint:** `https://geo.api.gouv.fr/communes/`

**Used for:** Resolving each detection's coordinates to a French commune, via
true point-in-polygon lookup (chosen over BAN address geocoding, which fails
for remote points with no nearby building — exactly the kind of point a
hotspot map cares about).

**Authentication:** none required

**Caching:** results are cached locally in `data/commune-cache.json` (keyed
by rounded coordinates, 30-day retention) to avoid re-geocoding the same
points on every 3-hour run.

Points outside France (the FIRMS bounding box also covers parts of Belgium,
Switzerland, Spain and Italy) that don't resolve to a French commune are
dropped.

## OpenStreetMap (base map tiles)

**Endpoint:** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`

**Used for:** Default base layer, configured in `src/config.ts`
(`baseLayers.OpenStreetMap`). © OpenStreetMap contributors, ODbL.

## Esri ArcGIS World Imagery (satellite base layer)

**Endpoint:** `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

**Used for:** Optional satellite imagery base layer, configured in
`src/config.ts` (`baseLayers.Satellite`). © Esri.

## GoatCounter (analytics)

**Endpoint:** `https://rlespinasse.goatcounter.com/count`

**Used for:** Privacy-friendly, cookie-less audience measurement. Loaded via
`count.js` in `index.html`; event prefixing configured in
`src/analytics.ts` and consumed by `leaflet-atlas` (see
[architecture.md](../explanation/architecture.md)).
