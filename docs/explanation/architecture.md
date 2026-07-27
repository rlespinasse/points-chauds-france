# Architecture

Points Chauds France is a static site with no backend and no database: a
data pipeline writes GeoJSON files, and a Vite-built frontend reads them.

## 1. Data pipeline

Runs every 3 hours via GitHub Actions (`refresh-firms.yml`):

```
NASA FIRMS API (per satellite: VIIRS_SNPP_NRT / NOAA20 / NOAA21)
    ↓
scripts/fetch-firms.mjs
    ↓
Reverse-geocode each point (geo.api.gouv.fr, point-in-polygon)
    ↓  (cached in data/commune-cache.json, 30-day retention)
Bucket by FRP → public/data/firms-france-{faible,moderee,forte}.geojson
    ↓
Archive → public/data/archive/YYYY-MM-DD.geojson (90-day retention)
    ↓
Commit changed files to main (if any)
```

Key features:

- Reverse-geocoding is cached (keyed by rounded coordinates) — the cron runs
  every 3h and each request's 5-day window overlaps ~5/6 with the previous
  run's, so without this cache nearly every point would be re-geocoded on
  every run
- Archive is deduped by `satellite + acq_date + acq_time + coordinates`
  (FIRMS has no stable per-detection ID)
- Commits only happen if data actually changed

## 2. Static site

Built with [Vite](https://vitejs.dev/) + [Leaflet](https://leafletjs.com/) +
[leaflet-atlas](https://github.com/rlespinasse/leaflet-atlas):

```
src/
├── main.ts        (bootstraps the map, time slider, FRP legend)
├── config.ts       (leaflet-atlas config: layers, styles, tooltips, legal pages)
├── analytics.ts    (shared GoatCounter config, consumed by leaflet-atlas)
└── css/
```

Key features:

- No backend required — reads GeoJSON files statically from `public/data/`
- Time slider (bottom-right): replays the last 5 live days one Paris-local
  calendar day at a time, and lazily fetches archived days beyond that
  window on demand
- FRP legend (bottom-left): driven by the same `frpScale` array used for
  layer styles, so it can't drift out of sync
- Search by location, layer toggles and legal pages provided by
  `leaflet-atlas` itself, driven entirely by `src/config.ts`

## 3. Deployment

Via GitHub Pages (`deploy.yml`):

```
Push to main (direct, or via refresh-firms.yml's data commit)
    ↓
GitHub Actions workflow
    ↓
npm run build (Vite)
    ↓
dist/ uploaded to GitHub Pages
    ↓
Live at https://rlespinasse.github.io/points-chauds-france/
```

Base path auto-detects from the repo name (see
[deploy.md](../how-to/deploy.md)), so renaming the repo needs no config
change.

## Why this architecture?

- **Fast** — static site, no server latency
- **Cheap** — free GitHub Pages hosting
- **Transparent** — data, code and docs all live in the same GitHub repo
- **Reliable** — no backend means fewer things to break; a stale data
  refresh doesn't take the site down, it just serves the last good commit
