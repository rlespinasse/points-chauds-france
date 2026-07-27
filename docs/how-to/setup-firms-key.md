# Setup NASA FIRMS API Key

To fetch fresh fire/hotspot detection data yourself, you need a free API key
(a "map key") from NASA FIRMS. Browsing the deployed site or running
`npm run dev` does **not** require a key — it only reads the GeoJSON files
already committed under `public/data/`.

## Get your API key

1. Visit [firms.modaps.eosdis.nasa.gov/api/map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
2. Request a map key (free, tied to your email address)
3. You'll receive your unique map key

## Use the API key

### Local development

Set it as an environment variable before running the fetch script:

```bash
FIRMS_MAP_KEY=xxxx npm run fetch-firms
```

### GitHub Actions (automated refresh)

The `refresh-firms.yml` workflow (runs every 3 hours) needs the key as a
repository secret:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `FIRMS_MAP_KEY`
5. Value: your API key

Without this secret, the workflow fails at the fetch step and the data goes
stale — the deployed site itself keeps working with whatever was last
committed.

## Verify it works

```bash
FIRMS_MAP_KEY=xxxx npm run fetch-firms
```

This should print progress logs and update the GeoJSON files under
`public/data/`. Run `npm run dev` afterwards to see the refreshed detections.
