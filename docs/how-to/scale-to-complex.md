# How to Scale to Complex Projects

This guide shows how to upgrade from simple `config.ts` to the `sources.json` + generator pattern when you have 20+ layers.

**Time:** 30-45 minutes | **Result:** Auto-generated config from metadata

## When to Upgrade

Upgrade when:
- ✅ You have 20+ layers
- ✅ Many layers follow similar patterns
- ✅ You're copy-pasting style definitions
- ✅ Adding layers feels repetitive

If you only have 5-10 layers, stick with simple `config.ts`.

See `docs/explanation/config-patterns.md` to understand the approaches.

---

## Step 1: Understand the New Pattern (5 minutes)

**Before (Stage 1 - Simple):**
```
src/config.ts (everything in one file)
```

**After (Stage 2 - Hybrid):**
```
data/sources.json           ← Layer metadata
  ↓ (npm run generate)
src/generated-config.js     ← Auto-generated JavaScript
  ↓ (import in config.ts)
src/config.ts               ← Import + customize
```

Each step is reversible. You can always go back.

---

## Step 2: Create data/sources.json (10 minutes)

This is the metadata for your layers. Start with the example:

```bash
# Copy the example
cp data/sources.json.example data/sources.json
```

Open `data/sources.json` and customize:

1. **Edit project info:**
   ```json
   "project": {
     "name": "My Atlas",
     "title": "My Interactive Map",
     "center": [48.8566, 2.3522],
     "zoom": 6
   }
   ```

2. **Define categories** (organize layers):
   ```json
   "categories": [
     { "id": "admin", "label": "Administrative", "description": "..." },
     { "id": "natural", "label": "Natural Features", "description": "..." }
   ]
   ```

3. **Add your layers** (replace example layers with yours):
   ```json
   "layers": {
     "admin/communes": {
       "name": "Communes",
       "category": "admin",
       "file": "communes.geojson",
       "geometry_type": "polygon",
       "style": { "color": "#1f2937", "fill": true, "fillColor": "#3b82f6", "fillOpacity": 0.1 },
       "tooltip_field": "nom",
       "search_props": { "title": "properties.nom", "text": ["properties.nom", "properties.code"] },
       "active": true
     },
     "admin/regions": { ... },
     "natural/forests": { ... }
   }
   ```

**Key fields:**
- `name` — Display name in layer control
- `category` — Which group it belongs to
- `file` — GeoJSON file name in public/data/
- `geometry_type` — "polygon", "linestring", or "point"
- `style` — Leaflet style object (color, fill, etc.)
- `tooltip_field` — Property to show on hover
- `search_props` — Which fields are searchable
- `active` — Visible on load (true/false)

Full schema: See `docs/reference/sources-schema.md`

---

## Step 3: Generate Config (2 minutes)

Run the generator:

```bash
npm run generate
```

Expected output:
```
✓ Generated src/generated-config.js
  15 layers configured
```

This creates `src/generated-config.js` with auto-generated JavaScript.

**What it contains:**
- `layerGroups` — All layers organized by category
- `styles` — All style definitions
- `tooltips` — All hover tooltips
- `searchableProps` — All search configurations

---

## Step 4: Update src/config.ts (10 minutes)

Now import the generated config and customize:

**Before:**
```typescript
export const config = {
  map: { ... },
  layerGroups: [
    { group: 'Admin', layers: [ ... ] },
    // ... 50 more lines of repetitive config
  ],
  styles: {
    communes: { ... },
    regions: { ... },
    // ... 50 more lines
  },
  // ... more config
}
```

**After:**
```typescript
import { layerGroups, styles, tooltips } from './generated-config.js'

export const config = {
  map: { ... },
  layerGroups,  // ← Use generated
  styles,       // ← Use generated
  tooltips,     // ← Use generated
  detailBuilders: () => ({
    communes: (p) => `<h2>${p.nom}</h2><p>Code: ${p.code}</p>`,
    regions: (p) => `<h2>${p.nom}</h2>`,
    // ... your custom detail builders
  }),
  legalPages: [ ... ],
}
```

**What you can override:**
```typescript
import { styles as generatedStyles } from './generated-config.js'

export const config = {
  // ...
  styles: {
    ...generatedStyles,  // Keep most
    communes: {
      ...generatedStyles.communes,  // Extend one
      fillOpacity: 0.05,  // Override specific property
    },
  },
  // ...
}
```

---

## Step 5: Verify Everything Works (5 minutes)

1. **Reload browser:**
   ```bash
   npm run dev
   ```
   Your map should look the same as before (but with less code).

2. **Check layers appear:**
   - Top-right: layer control shows your groups
   - All layers toggle on/off correctly
   - Styles match what you defined

3. **Test interactivity:**
   - Hover → tooltips appear
   - Click → detail panels appear
   - Zoom → map loads correctly

If something breaks:
```bash
# Regenerate (you didn't edit the generator)
npm run generate

# Check the output file
cat src/generated-config.js
```

---

## Step 6: Adding New Layers (Going Forward)

Now adding layers is fast:

1. **Download GeoJSON:**
   ```bash
   # Get your data from datagouv or elsewhere
   cp ~/Downloads/new-data.geojson public/data/
   ```

2. **Add to sources.json:**
   ```json
   "new_layer": {
     "name": "New Data",
     "category": "admin",
     "file": "new-data.geojson",
     "geometry_type": "polygon",
     "style": { "color": "#...", "fill": true, "fillColor": "#..." },
     "tooltip_field": "name",
     "active": false
   }
   ```

3. **Regenerate:**
   ```bash
   npm run generate
   ```

4. **Customize in config.ts** (if needed):
   ```typescript
   detailBuilders: () => ({
     new_layer: (p) => `<h2>${p.name}</h2>...`,
     // ... other builders
   }),
   ```

Done! No need to manually add layer definitions.

---

## Mixing Simple + Generated

You can mix both approaches:

```typescript
import { layerGroups as generatedLayers, styles as generatedStyles } from './generated-config.js'

export const config = {
  layerGroups: [
    ...generatedLayers,  // All generated layers
    {
      group: 'Custom',
      layers: [
        { id: 'custom', label: 'My Custom Layer', file: 'data/custom.geojson' }
      ]
    }
  ],
  styles: {
    ...generatedStyles,  // All generated styles
    custom: { color: '#f00', fill: true }  // Custom style
  },
  // ...
}
```

---

## Rolling Back

If you want to go back to Stage 1 (simple config):

1. Delete `data/sources.json` and `src/generated-config.js`
2. Copy the config back into `src/config.ts` manually
3. Delete the import lines

Everything still works. No data loss.

---

## Troubleshooting

**Generator crashes:**
- Check `data/sources.json` is valid JSON (use https://jsonlint.com)
- All required fields present (name, file, style, geometry_type)
- File names match actual files in `public/data/`

**Layers don't appear after regenerate:**
- Reload browser (sometimes needs hard refresh: Ctrl+Shift+R)
- Check browser console (F12) for errors
- Verify layer `file` paths are correct

**Styles didn't update:**
- Re-run `npm run generate`
- Make sure you're editing `data/sources.json`, not `generated-config.js`
- Reload browser

---

## See Also

- `docs/explanation/config-patterns.md` — When to use which approach
- `docs/reference/sources-schema.md` — Full sources.json schema
- `data/sources.json.example` — Complete example with all fields
