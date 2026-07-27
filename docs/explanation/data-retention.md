# Data Retention Policy

This document explains how fire/hotspot detection data is stored and
managed over time.

## Retention tiers

### Live data (last 5 days)

- `public/data/firms-france-{faible,moderee,forte}.geojson` — current
  5-day window, bucketed by Fire Radiative Power (FRP)
- `public/data/communes-context.geojson` — communes with at least one
  current detection
- Refreshed every 3 hours by `refresh-firms.yml`; fully replaced each run

### Local archive (90-day rolling window)

- `public/data/archive/YYYY-MM-DD.geojson` — one file per Paris-local
  calendar day
- `public/data/archive/index.json` — list of available archived dates
- Days older than `ARCHIVE_MAX_AGE_DAYS` (90, see `scripts/fetch-firms.mjs`)
  are purged automatically on every refresh run
- Can be extended backwards via `FIRMS_BACKFILL_DAYS` (see
  [work-with-archives.md](../how-to/work-with-archives.md)), limited by
  however much near-real-time retention FIRMS itself still has for a given
  date

### Reverse-geocoding cache

- `data/commune-cache.json`, keyed by rounded coordinates
- 30-day retention, refreshed opportunistically as new points are looked up
- Purely a performance optimization: consecutive 3-hour runs' 5-day windows
  overlap by ~5/6, so without this cache nearly every point would be
  re-geocoded on every run

## Why these timeframes?

**5 days (live):**

- The maximum NASA FIRMS allows per API request — see
  [why-5-day-limit.md](./why-5-day-limit.md)

**90 days (archive):**

- Long enough for meaningful trend analysis
- Keeps the git repository size reasonable, since every archived day is
  committed to `main`

**30 days (geocoding cache):**

- Reduces load on `geo.api.gouv.fr`
- Commune boundaries don't change often enough to need shorter-lived cache
  entries

## Cleanup process

Every run of `refresh-firms.yml` (every 3 hours):

1. Fetches the latest 5-day live window per satellite
2. Reverse-geocodes new points (using/refreshing the cache)
3. Rewrites the live GeoJSON buckets and commune-context file
4. Appends new points to today's archive file, dedupes, and rewrites
   `archive/index.json`
5. Deletes archive days older than 90 days
6. Commits changed files to `main` only if something actually changed

## Accessing data older than the archive

For detections older than the current 90-day archive window, the only
options are:

1. Browse the repository's git history (older archive commits still exist
   there even after the file itself is removed from `main`)
2. Run a manual backfill (`FIRMS_BACKFILL_DAYS=<n> npm run fetch-firms`),
   bounded by FIRMS's own near-real-time data retention for those dates
