# Points chauds France

**Points chauds France** is an interactive map of satellite-detected heat/fire hotspots ("points chauds") across France, built from NASA FIRMS VIIRS active-fire data. It shows every thermal detection captured by the Suomi NPP, NOAA-20 and NOAA-21 satellites over the last 5 days — industrial sites, flares, agricultural burning and actual vegetation fires alike. The app doesn't distinguish forest fires from other heat sources; it visualizes raw satellite detections, not confirmed incident reports.

Each hotspot is reverse-geocoded to its French commune, colored by Fire Radiative Power (FRP) intensity, and can be replayed day-by-day using an on-map time slider.

## Running locally

```bash
git clone https://github.com/rlespinasse/points-chauds-france
cd points-chauds-france
npm install
npm run dev
```

Opens http://localhost:5173 using the hotspot data already committed in `public/data/`. To refresh it yourself, get a free key at https://firms.modaps.eosdis.nasa.gov/api/map_key/ and run:

```bash
FIRMS_MAP_KEY=xxxx npm run fetch-firms
```

Other scripts: `npm run build` (production build), `npm run preview` (preview that build), `npm run validate-config` (checks every `public/data/*.geojson` is valid — also runs automatically on every `src/config.ts` edit via a Claude Code hook, see `.claude/settings.json`).

`package.json` also still lists `discover-dataset` and `generate` — unused leftovers from the `geopages-template` scaffold this project started from (a generic multi-layer scaling pattern this app never needed, since it has exactly 4 fixed, hand-written layers).

## Architecture

```
NASA FIRMS API ──▶ scripts/fetch-firms.mjs ──▶ public/data/*.geojson ──▶ src/config.ts + src/main.ts ──▶ static site
                         │
                         ├─▶ data/commune-cache.json   (geocoding cache, 30-day retention)
                         └─▶ data/archive/YYYY-MM-DD.geojson  (own history, 90-day retention)
```

No backend, no database: `scripts/fetch-firms.mjs` writes GeoJSON files into `public/data/`, and the frontend is a static Vite build reading them through [`leaflet-atlas`](https://www.npmjs.com/package/leaflet-atlas), a config-driven Leaflet wrapper.

**The pipeline**, in order:
1. **Fetch** — FIRMS area CSV API, once per satellite (`VIIRS_SNPP_NRT`/`NOAA20`/`NOAA21`), over France + Corsica, requesting the maximum 5-day window FIRMS allows per request (`DAY_RANGE = 5`).
2. **Reverse-geocode** each point to its commune via `geo.api.gouv.fr` (point-in-polygon, unlike BAN address geocoding which fails on remote points with no nearby building). Cached in `data/commune-cache.json` (keyed by rounded coordinates) — the cron runs every 3h and each request's 5-day window overlaps ~5/6 with the previous run's, so without this cache nearly every point would be re-geocoded on every run.
3. **Archive** — every point is appended to `data/archive/YYYY-MM-DD.geojson`, deduped by `satellite + acq_date + acq_time + coordinates` (FIRMS has no stable per-detection ID). Exists because FIRMS caps a single request at 5 days — this local archive is the only place history beyond that survives. **Not yet wired into the frontend** (the time slider still only covers the live 5-day window).
4. **Bucket by FRP** into `public/data/firms-france-{faible,moderee,forte}.geojson` (<5MW / 5-20MW / ≥20MW) — `leaflet-atlas` styles a whole layer at once, so per-intensity coloring is one layer/file per bucket.
5. **Commune context** — `public/data/communes-context.geojson`, boundary + hotspot count per commune with at least one detection.

**Frontend**: `src/config.ts` is the `leaflet-atlas` config (layers, styles, tooltips, detail panels). `src/main.ts` bootstraps the map and adds two hand-built controls (not part of `leaflet-atlas` itself): a **time slider** (bottom-right, steps through the last 5 days one Paris-local calendar day at a time — since `leaflet-atlas` has no per-feature filter API, it reaches into each layer's `L.geoJSON` FeatureGroup directly via `getAllLayerDefs()`), and an **FRP legend** (bottom-left, driven by the same `frpScale` array used for the layer styles so it can't drift out of sync).

## Deployment

Already fully configured — nothing to set up beyond the secret below.

- **`.github/workflows/deploy.yml`** builds with Vite and deploys to GitHub Pages (Actions-based, no `gh-pages` branch) on every push to `main`. Base path auto-detects from the repo name (`vite.config.js`'s `getBasePath()`), so renaming the repo needs no config change.
- **`.github/workflows/refresh-firms.yml`** runs the fetch pipeline every 3 hours and commits changed data files to `main` — which naturally re-triggers `deploy.yml` via its normal push trigger, no special-casing needed. Requires a **`FIRMS_MAP_KEY` repository secret** (Settings → Secrets and variables → Actions → New repository secret) — without it the workflow fails at the fetch step and data goes stale, though the deployed site itself keeps working with whatever was last committed.

## FAQ

**Why only 5 days of history?** FIRMS's API caps a single request at 5 days; there's no way to ask for more in one call. The local archive (see above) accumulates more, just not wired into the UI yet.

**Does this only show forest fires?** No — every VIIRS thermal detection in the bounding box, not just forest fires. An earlier version filtered against BD Forêt (French forest cover) to isolate likely forest fires; that filter was deliberately removed.

## Data sources

- Hotspot detections: [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (LANCE, NASA GSFC) — VIIRS Suomi NPP, NOAA-20, NOAA-21.
- Commune/département/région lookup: [geo.api.gouv.fr](https://geo.api.gouv.fr/) (Etalab).

## Contributing

Bug reports and PRs welcome at [github.com/rlespinasse/points-chauds-france](https://github.com/rlespinasse/points-chauds-france/issues). No automated test suite yet — `npm run build` is the sanity check. Contributions are licensed under MIT.

## License

MIT
