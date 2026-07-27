# Schéma de configuration

`src/config.ts` est la source de vérité unique pour la carte : couches de
fond, couches de données, styles, infobulles, pages légales et analytics.
Il est consommé directement par
[`leaflet-atlas`](https://github.com/rlespinasse/leaflet-atlas) (via
`MapApp` dans `src/main.ts`) — il n'y a pas d'étape de build séparée pour le
générer.

## Structure (informelle — voir `src/config.ts` pour le TypeScript exact)

```typescript
export const config = {
  map: {
    elementId: string    // ID de l'élément HTML où la carte est montée
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
      url: string          // modèle d'URL de tuile
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
  styles: { [layerId: string]: object },     // options de style Leaflet (path/marker)
  tooltips: { [layerId: string]: Function },
  detailBuilders: () => ({ [layerId: string]: Function }),

  legalPages: Array<{
    id: string      // ex. 'about', 'mentions', 'donnees', 'confidentialite'
    label: string   // ex. 'À propos'
    content: string // chaîne HTML brute
  }>,

  analytics: {
    provider: 'goatcounter'
    basePath: string  // ex. '/points-chauds-france/'
  },
}
```

## Échelle FRP et répartition en buckets

`frpScale` (en haut de `src/config.ts`) définit les buckets d'intensité de
puissance radiative du feu (FRP) utilisés à la fois pour les couches de
données (`firms_{id}`) et la légende de la carte, afin qu'ils ne puissent
pas se désynchroniser :

- `faible` (< 5 MW)
- `moderee` (5–20 MW)
- `forte` (≥ 20 MW)

`frpBucketId(frp: number)` associe une valeur FRP brute à l'identifiant de
son bucket ; cette même fonction est utilisée par `scripts/fetch-firms.mjs`
lors de l'écriture des fichiers GeoJSON répartis par bucket, afin que le
frontend et le pipeline restent cohérents.

## Pages légales

Rendues par le contrôle de pages légales de `leaflet-atlas`. Pages
actuelles :

- `about` — « À propos »
- `mentions` — « Mentions légales »
- `donnees` — « Données & licences »
- `confidentialite` — « Confidentialité »
- `credits` — « Crédits »

## Analytics

`config.analytics` correspond à `analyticsConfig`, exporté depuis
`src/analytics.ts`. Il ne porte que le nom du fournisseur GoatCounter et le
préfixe `basePath` des événements — `leaflet-atlas` instancie lui-même le
traqueur à partir de cette configuration et émet ses propres événements
d'usage natifs. La balise de script GoatCounter et le compte/endpoint
(`https://rlespinasse.goatcounter.com/count`) se trouvent directement dans
`index.html`. Voir [architecture.md](../explications/architecture.md).

## Variables d'environnement

Ne font pas partie de `config.ts` lui-même, mais sont pertinentes pour
exécuter/déployer le site :

```bash
# Requis uniquement pour npm run fetch-firms (pas dev/build)
FIRMS_MAP_KEY=your_nasa_api_key

# Optionnel
FIRMS_BACKFILL_DAYS=30
VITE_BASE_PATH=/custom-path/
```
