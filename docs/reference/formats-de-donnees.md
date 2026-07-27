# Formats de données

Formats de fichiers utilisés dans l'ensemble du projet.

## GeoJSON

**Format :** `application/geo+json`, `FeatureCollection` de features `Point`
(points chauds) ou `Polygon`/`MultiPolygon` (contexte communal).

**Fichiers (tous sous `public/data/`) :**

- `firms-france-faible.geojson`, `firms-france-moderee.geojson`,
  `firms-france-forte.geojson` — fenêtre en direct de 5 jours, répartie par
  intensité FRP (voir [schema-config.md](./schema-config.md) pour les seuils)
- `communes-context.geojson` — limites communales avec un nombre de points
  chauds, pour les communes ayant au moins une détection en cours
- `archive/YYYY-MM-DD.geojson` — un fichier par jour archivé (jusqu'à
  90 jours)
- `archive/index.json` — JSON simple (pas du GeoJSON), liste
  `{ "dates": [...] }` des dates archivées disponibles pour le curseur
  temporel

**Structure d'une feature de point chaud (approximative — voir
`csvToGeoJSON()` dans `scripts/fetch-firms.mjs` pour la correspondance
faisant référence) :**

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [2.35, 46.6]
  },
  "properties": {
    "brightness": 320.5,
    "frp": 12.4,
    "acq_date": "2026-07-20",
    "acq_time": "1430",
    "confidence": "n",
    "satellite": "N",
    "commune": "...",
    "commune_code": "...",
    "departement": "...",
    "region": "..."
  }
}
```

## Fichiers de cache et d'index

### `data/commune-cache.json`

Cache de géocodage inverse, indexé par coordonnées arrondies, avec une
rétention de 30 jours. Non déployé sur le site construit — utilisé
uniquement pendant `npm run fetch-firms`.

### `data/sources.json.example`

Exemple/modèle pour la génération de configuration pilotée par jeu de
données du squelette `geopages-template` (`scripts/generate-config.py`).
Non utilisé par la configuration réelle de ce projet, qui est écrite à la
main dans `src/config.ts` — conservé uniquement comme référence résiduelle.
Voir [scripts-npm.md](./scripts-npm.md#unused-leftovers).

## Configuration

### `src/config.ts`

TypeScript, configuration `leaflet-atlas` écrite à la main — voir
[schema-config.md](./schema-config.md).

### `.env.local` (non commité)

```
VITE_BASE_PATH=/your-path/
```

Utile uniquement pour surcharger localement le chemin de base de
déploiement ; `dev`/`build` n'ont pas besoin d'une clé FIRMS (elle ne sert
que pour `npm run fetch-firms`, transmise comme une simple variable
d'environnement shell, pas préfixée `VITE_`, puisqu'elle n'est lue que par
le script Node.js de récupération et n'est jamais intégrée au frontend).

## Sortie de build

### `dist/`

Site statique prêt pour la production, généré par `npm run build` :

```
dist/
├── index.html
├── assets/
│   ├── *.js
│   └── *.css
├── favicon.svg
└── data/
    └── (une copie de public/data/, y compris archive/)
```
