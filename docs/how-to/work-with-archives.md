# Work with Historical Archives

NASA FIRMS caps a single API request at a 5-day window. This project keeps
its own local archive to retain history beyond that window, with a 90-day
rolling retention.

## Archive structure

```
public/data/archive/
├── index.json           (list of available archived dates)
├── 2026-07-20.geojson
├── 2026-07-19.geojson
└── ...
```

Each `YYYY-MM-DD.geojson` file holds all detections for that Paris-local
calendar day, deduped by `satellite + acq_date + acq_time + coordinates`
(FIRMS has no stable per-detection ID).

## Accessing archived data

### In the web app

The time slider (bottom-right of the map) steps through the live 5-day
window and lazily fetches archived days beyond it on demand, using
`config.archive.indexFile` and `config.archive.dayFile(date)` (see
`src/config.ts`).

### Programmatically

```bash
# List available archived dates
cat public/data/archive/index.json

# Read a specific day
cat public/data/archive/2026-07-20.geojson
```

## Retention policy

- Archive days older than `ARCHIVE_MAX_AGE_DAYS` (90 days, see
  `scripts/fetch-firms.mjs`) are purged automatically on every refresh run
- Archives are updated every 3 hours by the `refresh-firms.yml` workflow
- The commune reverse-geocoding cache (`data/commune-cache.json`) has its own
  30-day retention, independent of the archive

## Backfilling older history

To pull more history into the archive than the 3-hour cron has accumulated
so far:

```bash
FIRMS_MAP_KEY=xxxx FIRMS_BACKFILL_DAYS=30 npm run fetch-firms
```

This walks backwards in 5-day chunks from FIRMS's near-real-time API. How far
back it can actually reach depends on FIRMS's own NRT data retention for
those dates, not just this project's 90-day archive cap.
