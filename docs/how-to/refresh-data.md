# Refresh Data Manually

By default, data refreshes automatically every 3 hours via the
`refresh-firms.yml` GitHub Actions workflow, which commits any changed data
files directly to `main`. To refresh manually:

## Local development

```bash
FIRMS_MAP_KEY=xxxx npm run fetch-firms
```

This runs `scripts/fetch-firms.mjs`, which:

1. Fetches the latest 5-day window of VIIRS detections from NASA FIRMS, once
   per satellite (`VIIRS_SNPP_NRT` / `NOAA20` / `NOAA21`), over France +
   Corsica
2. Reverse-geocodes each point to its commune via `geo.api.gouv.fr`
   (point-in-polygon), caching results in `data/commune-cache.json`
3. Buckets points by Fire Radiative Power (FRP) into
   `public/data/firms-france-{faible,moderee,forte}.geojson`
4. Updates `public/data/communes-context.geojson` (commune boundaries +
   hotspot counts)
5. Appends every point to `public/data/archive/YYYY-MM-DD.geojson`, deduped by
   `satellite + acq_date + acq_time + coordinates`, and refreshes
   `public/data/archive/index.json`
6. Purges archive days older than 90 days

## Manual trigger on GitHub

1. Go to the repository's Actions tab
2. Select "Refresh FIRMS data" (`refresh-firms.yml`)
3. Click "Run workflow" on `main`

The workflow commits changed data files directly to `main`, which naturally
re-triggers the `deploy.yml` push-triggered workflow — no special-casing
needed.

## Backfilling older history

FIRMS caps a single request at 5 days. To pull older detections into the
local archive (as far back as FIRMS's own near-real-time retention allows for
those dates):

```bash
FIRMS_MAP_KEY=xxxx FIRMS_BACKFILL_DAYS=30 npm run fetch-firms
```

## Validating the result

```bash
npm run validate-config
```

Checks that every `public/data/*.geojson` file is valid GeoJSON. This also
runs automatically on every `src/config.ts` edit via a Claude Code hook (see
`.claude/settings.json`).
