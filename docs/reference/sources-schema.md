# sources.json Schema Reference

Complete reference for the `data/sources.json` file used in the two-stage configuration pattern (Stage 2 & 3).

## Overview

`sources.json` is a metadata file that defines all your layers. The generator script reads it and creates `src/generated-config.js`.

```json
{
  "project": { ... },
  "categories": [ ... ],
  "layers": { ... }
}
```

---

## Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project` | object | Yes | Project metadata |
| `categories` | array | Yes | Layer groups/categories |
| `layers` | object | Yes | Layer definitions |

---

## Project Object

Metadata about the atlas.

```json
{
  "project": {
    "name": "My Atlas",
    "title": "My Interactive Map",
    "description": "Exploring geographic data",
    "center": [48.8566, 2.3522],
    "zoom": 6,
    "basePath": "/"
  }
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | No | (unused) | Internal name |
| `title` | string | No | | Map title (appears in UI) |
| `description` | string | No | | Map subtitle |
| `center` | [lat, lng] | No | [0, 0] | Initial map center |
| `zoom` | number | No | 2 | Initial zoom level |
| `basePath` | string | No | "/" | Base path for deployment |

---

## Categories Array

Organize layers into groups.

```json
{
  "categories": [
    {
      "id": "administrative",
      "label": "Administrative Divisions",
      "description": "Political boundaries"
    },
    {
      "id": "natural",
      "label": "Natural Features",
      "description": "Forests, water, terrain"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (use in layer.category) |
| `label` | string | Yes | Display name in layer control |
| `description` | string | No | Tooltip/help text |

---

## Layers Object

Define all your data layers.

```json
{
  "layers": {
    "administrative/communes": { ... },
    "natural/forests": { ... }
  }
}
```

Key format: `"category/layer-id"` (human-readable, used in generated config)

### Layer Definition

Complete layer object:

```json
{
  "administrative/communes": {
    "name": "Communes",
    "category": "administrative",
    "description": "French municipal boundaries",
    "dataset_id": "5d95544ac751df306cd20c21",
    "resource_id": "8f2852b4-76c7-40ae-b75b-9841a6cfee31",
    "dataset_url": "https://www.data.gouv.fr/datasets/...",
    "format": "geojson",
    "file": "communes.geojson",
    "geometry_type": "polygon",
    "style": { ... },
    "tooltip_field": "nom",
    "search_props": { ... },
    "detail_fields": ["nom", "code", "region"],
    "active": true,
    "metadata": { ... }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name in layer control |
| `category` | string | Yes | Category ID (from categories array) |
| `description` | string | No | Layer description |
| `dataset_id` | string | No | datagouv.fr dataset ID (for reference) |
| `resource_id` | string | No | datagouv.fr resource ID (for reference) |
| `dataset_url` | string | No | Link to dataset on data.gouv.fr |
| `format` | string | No | Data format (geojson, shapefile, etc.) |
| `file` | string | Yes | Filename in `public/data/` (no path) |
| `geometry_type` | string | Yes | "polygon", "linestring", or "point" |
| `style` | object | Yes | Leaflet style (see below) |
| `tooltip_field` | string | Yes | Property name to show on hover |
| `search_props` | object | No | Search configuration (see below) |
| `detail_fields` | array | No | Properties to show in detail panel |
| `active` | boolean | No | Visible on map load (default: false) |
| `metadata` | object | No | Custom metadata (source, year, etc.) |

---

## Style Object

Leaflet style definition. Varies by geometry type.

### Polygon Style

```json
{
  "style": {
    "color": "#1f2937",
    "weight": 1,
    "opacity": 0.8,
    "fill": true,
    "fillColor": "#3b82f6",
    "fillOpacity": 0.1"
  }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | string | #3388ff | Stroke color (hex or CSS name) |
| `weight` | number | 3 | Stroke width in pixels |
| `opacity` | number | 0.5 | Stroke opacity (0-1) |
| `fill` | boolean | true | Fill interior |
| `fillColor` | string | same as color | Fill color |
| `fillOpacity` | number | 0.2 | Fill opacity (0-1) |
| `dashArray` | string | - | Dashed line pattern |
| `lineCap` | string | "round" | "butt", "round", "square" |
| `lineJoin` | string | "round" | "bevel", "round", "miter" |

### LineString Style

```json
{
  "style": {
    "color": "#1f2937",
    "weight": 2,
    "opacity": 0.8,
    "dashArray": "5, 5"
  }
}
```

Same as polygon but without fill properties.

### Point Style

```json
{
  "style": {
    "radius": 5,
    "color": "#1f2937",
    "fill": true,
    "fillColor": "#ef4444",
    "fillOpacity": 0.8"
  }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `radius` | number | 5 | Point radius in pixels |
| `color` | string | #3388ff | Outline color |
| `weight` | number | 2 | Outline width |
| `fill` | boolean | true | Fill interior |
| `fillColor` | string | same as color | Fill color |
| `fillOpacity` | number | 1 | Fill opacity |

---

## Search Props Object

Configure what properties are searchable.

```json
{
  "search_props": {
    "title": "properties.nom",
    "text": [
      "properties.nom",
      "properties.code",
      "properties.region"
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Primary search result text (dot notation: `properties.fieldName`) |
| `text` | array | Array of property paths to search within |

---

## Color Reference

Common colors (hex codes):

| Color | Hex | CSS Name |
|-------|-----|----------|
| Red | #ef4444 | crimson |
| Blue | #3b82f6 | dodgerblue |
| Green | #10b981 | mediumseagreen |
| Gray | #6b7280 | gray |
| Purple | #8b5cf6 | blueviolet |
| Orange | #f97316 | orange |
| Yellow | #eab308 | gold |

Use https://htmlcolorcodes.com for custom colors.

---

## Geometry Types

| Type | Example | Style |
|------|---------|-------|
| polygon | Communes, regions, forests | Fill + outline |
| linestring | Roads, rivers, boundaries | Outline only |
| point | Cities, landmarks | Radius + fill |

If unsure, use `"polygon"` as default.

---

## Complete Example

See `data/sources.json.example` in your template for a full working example with 3 layers.

---

## Common Patterns

### Admin Boundaries (Polygons)

```json
{
  "name": "Communes",
  "geometry_type": "polygon",
  "style": {
    "color": "#1f2937",
    "weight": 1,
    "fill": true,
    "fillColor": "#3b82f6",
    "fillOpacity": 0.1
  },
  "tooltip_field": "nom"
}
```

### Natural Features (Polygons)

```json
{
  "name": "Forests",
  "geometry_type": "polygon",
  "style": {
    "color": "#166534",
    "weight": 1,
    "fill": true,
    "fillColor": "#22c55e",
    "fillOpacity": 0.3
  }
}
```

### Infrastructure (Lines)

```json
{
  "name": "Roads",
  "geometry_type": "linestring",
  "style": {
    "color": "#f97316",
    "weight": 3,
    "opacity": 0.8
  }
}
```

### Points of Interest

```json
{
  "name": "Cities",
  "geometry_type": "point",
  "style": {
    "radius": 6,
    "color": "#dc2626",
    "fillColor": "#ef4444",
    "fillOpacity": 0.8
  }
}
```

---

## Validation

Before running `npm run generate`, validate your JSON:

1. Use https://jsonlint.com to check syntax
2. Ensure all required fields are present
3. Check that `file` references match actual files in `public/data/`
4. Verify `category` IDs exist in categories array

---

## See Also

- `data/sources.json.example` — Complete example
- `docs/how-to/scale-to-complex.md` — How to use sources.json
- `scripts/generate-config.py` — The generator that reads this file
