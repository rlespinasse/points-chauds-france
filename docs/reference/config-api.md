# Config API Reference

Complete reference for `src/config.ts` configuration options.

## Overview

The config is a single object passed to `new MapApp(config)`:

```typescript
export const config = {
  map: { ... },
  title: { ... },
  baseLayers: { ... },
  layerGroups: [ ... ],
  styles: { ... },
  tooltips: { ... },
  detailBuilders: () => ({ ... }),
  legalPages: [ ... ],
}
```

---

## Map Options

Configure the map container and initial view.

```typescript
map: {
  elementId: 'map',        // HTML element ID (string)
  center: [48.8566, 2.3522],  // Initial center [lat, lng] (array of 2 numbers)
  zoom: 12,               // Initial zoom level (0-28, number)
}
```

| Option | Type | Required | Example | Notes |
|--------|------|----------|---------|-------|
| `elementId` | string | Yes | `'map'` | Element ID in index.html where map mounts |
| `center` | [number, number] | Yes | `[48.8566, 2.3522]` | Latitude, Longitude |
| `zoom` | number | Yes | `12` | 0 (world) to 28 (street level) |

---

## Title Options

Configure map title, subtitle, and favicon.

```typescript
title: {
  heading: 'My Atlas',
  subtitle: 'Interactive map',
  icon: 'favicon.svg',
}
```

| Option | Type | Required | Example |
|--------|------|----------|---------|
| `heading` | string | Yes | `'French Communes'` |
| `subtitle` | string | No | `'All French communes'` |
| `icon` | string | No | `'favicon.svg'` |

---

## Base Layers

Define tile layers (base maps) users can switch between.

```typescript
baseLayers: {
  'OpenStreetMap': {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    },
  },
  'Satellite': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: '© Esri',
      maxZoom: 18,
    },
  },
},
defaultBaseLayer: 'OpenStreetMap',
```

| Option | Type | Notes |
|--------|------|-------|
| `[name]: { url, options }` | object | Each entry is a switchable base layer |
| `url` | string | Leaflet tile URL with `{z}/{x}/{y}` |
| `options.attribution` | string | Credit line |
| `options.maxZoom` | number | Highest zoom available |
| `defaultBaseLayer` | string | Which layer loads first |

**Common tile URLs:**
- OpenStreetMap: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- Satellite (ESRI): `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- CartoDB Light: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png`
- CartoDB Dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`

---

## Layer Groups

Define data layers organized by category.

```typescript
layerGroups: [
  {
    group: 'Administrative',
    layers: [
      {
        id: 'communes',
        label: 'Communes',
        file: 'data/communes.geojson',
        active: true,
      },
      {
        id: 'regions',
        label: 'Regions',
        file: 'data/regions.geojson',
        active: false,
      },
    ],
  },
  {
    group: 'Points of Interest',
    layers: [
      {
        id: 'museums',
        label: 'Museums',
        file: 'data/museums.geojson',
        active: false,
      },
    ],
  },
],
```

| Option | Type | Notes |
|--------|------|-------|
| `group` | string | Category name (appears in layer drawer) |
| `layers[].id` | string | Unique identifier (must match `styles`, `tooltips`, etc.) |
| `layers[].label` | string | Display name in layer control |
| `layers[].file` | string | Path to GeoJSON file (relative to public/) |
| `layers[].active` | boolean | Visible on map load |

---

## Styles

Define visual appearance of each layer.

```typescript
styles: {
  communes: {
    color: '#1f2937',      // Stroke color
    weight: 1,             // Stroke width (pixels)
    opacity: 0.9,          // Stroke opacity (0-1)
    fill: true,            // Fill polygon interiors
    fillColor: '#3b82f6',  // Fill color
    fillOpacity: 0.2,      // Fill opacity (0-1)
  },
  museums: {
    radius: 6,             // Point size (if GeoJSON is Point)
    color: '#dc2626',      // Point color
    fillColor: '#ef4444',
    fillOpacity: 0.8,
  },
},
```

**For polygons/lines:**
| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `color` | string | `'#3388ff'` | Stroke color (hex or name) |
| `weight` | number | `3` | Stroke width in pixels |
| `opacity` | number | `0.5` | Stroke opacity |
| `fill` | boolean | `true` | Fill the interior |
| `fillColor` | string | Same as `color` | Interior fill color |
| `fillOpacity` | number | `0.2` | Interior opacity |

**For points:**
| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `radius` | number | `5` | Point radius in pixels |
| `color` | string | `'#3388ff'` | Point color |
| `fillColor` | string | Same as `color` | Fill color |
| `fillOpacity` | number | `1` | Fill opacity |

---

## Tooltips

What appears on hover.

```typescript
tooltips: {
  communes: (properties) => {
    return `<strong>${properties.nom}</strong>`
  },
  museums: (properties) => {
    return `${properties.name} (${properties.type})`
  },
},
```

| Signature | Notes |
|-----------|-------|
| `(properties) => string` | Function receives GeoJSON properties, returns HTML string |

The HTML string is displayed in a small popup on hover.

---

## Detail Builders

What appears when clicking a feature.

```typescript
detailBuilders: () => ({
  communes: (properties) => `
    <h2>${properties.nom}</h2>
    <p>Population: ${properties.population || 'N/A'}</p>
    <dl>
      <dt>Code</dt><dd>${properties.code}</dd>
      <dt>Region</dt><dd>${properties.region}</dd>
    </dl>
  `,
  museums: (properties) => `
    <h2>${properties.name}</h2>
    <p>${properties.description || ''}</p>
    <a href="${properties.website}" target="_blank">Visit</a>
  `,
}),
```

| Signature | Notes |
|-----------|-------|
| `() => ({ [layerId]: (properties) => string })` | Returns object mapping layer IDs to builder functions |

Builder functions receive GeoJSON properties and return HTML.

**Useful properties:**
- `properties.name` — Feature name (varies by dataset)
- `properties.description` — Details
- Any custom properties in the GeoJSON

---

## Legal Pages

Custom pages (About, Data Sources, etc.) accessible in the map UI.

```typescript
legalPages: [
  {
    id: 'about',
    label: 'About',
    content: `
      <h2>About This Atlas</h2>
      <p>This atlas shows French administrative divisions.</p>
      <h3>Data Sources</h3>
      <ul>
        <li>Communes: INSEE, 2022</li>
        <li>Regions: IGN, 2020</li>
      </ul>
    `,
  },
  {
    id: 'sources',
    label: 'Data Sources',
    content: `<h2>Data Sources</h2>...`,
  },
],
```

| Option | Type | Notes |
|--------|------|-------|
| `id` | string | Unique identifier |
| `label` | string | Tab label |
| `content` | string | HTML content |

---

## Full Example

```typescript
export const config = {
  map: {
    elementId: 'map',
    center: [46.6, 2.5],
    zoom: 6,
  },

  title: {
    heading: 'French Atlas',
    subtitle: 'Exploring French geodata',
    icon: 'favicon.svg',
  },

  baseLayers: {
    'Street': {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: { attribution: '© OpenStreetMap', maxZoom: 19 },
    },
    'Satellite': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: { attribution: '© Esri', maxZoom: 18 },
    },
  },
  defaultBaseLayer: 'Street',

  layerGroups: [
    {
      group: 'Administrative',
      layers: [
        { id: 'communes', label: 'Communes', file: 'data/communes.geojson', active: true },
      ],
    },
  ],

  styles: {
    communes: {
      color: '#1f2937',
      weight: 1,
      fill: true,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
    },
  },

  tooltips: {
    communes: (p) => p.nom,
  },

  detailBuilders: () => ({
    communes: (p) => `
      <h2>${p.nom}</h2>
      <dl>
        <dt>Code</dt><dd>${p.code}</dd>
      </dl>
    `,
  }),

  legalPages: [
    {
      id: 'about',
      label: 'About',
      content: '<h2>About</h2><p>French geodata atlas.</p>',
    },
  ],
}
```

---

**More help?** See `docs/how-to/customize-styling.md` or ask Claude Code: "How do I change the [property]?"
