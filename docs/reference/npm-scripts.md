# npm Scripts

Available commands, as defined in `package.json`.

## Development

### `npm run dev`

Starts the Vite dev server with hot reload at `http://localhost:5173`, using
the GeoJSON data already committed under `public/data/`.

### `npm run build`

Production build via Vite, output to `dist/`.

### `npm run preview`

Serves the production build from `dist/` locally, for a final check before
deploying.

## Data pipeline

### `npm run fetch-firms`

Runs `scripts/fetch-firms.mjs`: fetches the latest FIRMS detections,
reverse-geocodes them, rewrites the live GeoJSON buckets and
`communes-context.geojson`, updates the archive, and purges archive days
older than 90 days. Requires `FIRMS_MAP_KEY` — see
[setup-firms-key.md](../how-to/setup-firms-key.md). Also accepts
`FIRMS_BACKFILL_DAYS=<n>` for a one-off historical backfill.

### `npm run validate-config`

Runs `scripts/validate-geojson.mjs`: checks that every file in
`public/data/*.geojson` is syntactically valid GeoJSON (a `FeatureCollection`
or `Feature`). Also runs automatically on every `src/config.ts` edit via a
Claude Code hook (see `.claude/settings.json`).

### `npm run validate-docs`

Runs `scripts/validate-docs.sh`: checks that every relative Markdown link in
`docs/README.md` resolves to a real file under `docs/`.

## Code quality

### `npm run lint`

Runs ESLint over the project (`eslint.config.ts`).

### `npm run lint:fix`

Runs ESLint with `--fix` to auto-correct fixable issues.

### `npm run format`

Formats the codebase with Prettier (`.prettierrc.json`).

### `npm run format:check`

Checks formatting without writing changes — used in CI.

## Unused leftovers

`package.json` also lists two scripts that are **not** part of the current
pipeline — leftovers from the `geopages-template` scaffold this project
started from (a generic multi-layer scaling pattern this app never needed,
since it has exactly 4 fixed, hand-written layers):

- `npm run discover-dataset` — placeholder pointing at data.gouv.fr dataset
  discovery, unused
- `npm run generate` — generates config from `data/sources.json.example`,
  unused; this project's `src/config.ts` is hand-written instead

## Environment variables

Required for data refresh:

- `FIRMS_MAP_KEY` — NASA FIRMS API key

Optional:

- `FIRMS_BACKFILL_DAYS` — one-off backfill of extra archive history (days)
- `VITE_BASE_PATH` — overrides the auto-detected deployment base path (see
  `vite.config.js`)

Example:

```bash
FIRMS_MAP_KEY=abc123 FIRMS_BACKFILL_DAYS=30 npm run fetch-firms
```
