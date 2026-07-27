# Configuration Schema

`src/config.ts` is the single source of truth for the map: base layers, data
layers, styles, tooltips, legal pages and analytics. It's consumed directly
by [`leaflet-atlas`](https://github.com/rlespinasse/leaflet-atlas) (via
`MapApp` in `src/main.ts`) — there's no separate build step to generate it.

## Shape (informal — see `src/config.ts` for the exact TypeScript)

```typescript
export const config = {
  map: {
    elementId: string    // HTML element ID where the map mounts
    center: [number, number] // [lat, lng]
    zoom: number
  },

  title: {
    heading: string
    subtitle: string
    icon: string
  },

  baseLayers: {
    [name: string]: {
      url: string          // tile URL template
      options: { attribution: string; maxZoom: number }
    }
  },
  defaultBaseLayer: string,

  layerGroups: Array<{
    group: string
    layers: Array<{ id: string; label: string; file: string; active: boolean }>
  }>,

  archive: {
    indexFile: string
    dayFile: (date: string) => string
  },

  contextLayers: Array<{ id: string; label: string; file: string; active: boolean }>,

  geometryTypes: { [layerId: string]: 'point' | 'polygon' },
  searchableProps: { [layerId: string]: string[] },
  styles: { [layerId: string]: object },     // Leaflet path/marker style options
  tooltips: { [layerId: string]: Function },
  detailBuilders: () => ({ [layerId: string]: Function }),

  legalPages: Array<{
    id: string      // e.g. 'about', 'mentions', 'donnees', 'confidentialite'
    label: string   // e.g. 'À propos'
    content: string // raw HTML string
  }>,

  analytics: {
    provider: 'goatcounter'
    basePath: string  // e.g. '/points-chauds-france/'
  },
}
```

## FRP scale and bucketing

`frpScale` (top of `src/config.ts`) defines the Fire Radiative Power
intensity buckets used both for the data layers (`firms_{id}`) and the map
legend, so they can't drift out of sync:

- `faible` (< 5 MW)
- `moderee` (5–20 MW)
- `forte` (≥ 20 MW)

`frpBucketId(frp: number)` maps a raw FRP value to its bucket id; this same
function is used by `scripts/fetch-firms.mjs` when writing the bucketed
GeoJSON files, so the frontend and pipeline stay consistent.

## Legal pages

Rendered by `leaflet-atlas`'s legal-pages control. Current pages:

- `about` — "À propos"
- `mentions` — "Mentions légales"
- `donnees` — "Données & licences"
- `confidentialite` — "Confidentialité"
- `credits` — "Crédits"

## Analytics

`config.analytics` is `analyticsConfig`, exported from `src/analytics.ts`. It
only carries the GoatCounter provider name and the event `basePath` prefix
— `leaflet-atlas` instantiates the tracker itself from this config and emits
native usage events. The GoatCounter script tag and account/endpoint
(`https://rlespinasse.goatcounter.com/count`) live directly in `index.html`.
See [architecture.md](../explanation/architecture.md).

## Environment variables

Not part of `config.ts` itself, but relevant to running/deploying the site:

```bash
# Required only for npm run fetch-firms (not dev/build)
FIRMS_MAP_KEY=your_nasa_api_key

# Optional
FIRMS_BACKFILL_DAYS=30
VITE_BASE_PATH=/custom-path/
```
