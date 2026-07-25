# How to Discover and Fetch Datasets

This guide shows how to find and download GeoJSON data from French open data sources to add to your atlas.

## Prerequisites

- Your geopages project set up and running (`npm run dev`)
- Claude Code open (for the fast method)
- A general idea of what data you're looking for ("communes", "parks", "buildings", etc.)

## Method 1: Claude Code + datagouv MCP (Fast, Recommended)

**Time:** 3-5 minutes per dataset

This method uses the custom `geopages:discover-dataset` skill (optional, but recommended).

### Step 1: Use the Custom Skill (Easiest)

In Claude Code, use the skill:

```
/geopages:discover-dataset "communes boundaries"
```

The skill will:
1. Query datagouv MCP for datasets
2. Filter to show only geographic data
3. Rank by relevance (downloads, quality, recency)
4. Show GeoJSON availability
5. Give recommendations

### Step 2: Get Results

```
Top matches for "communes boundaries":

1. ✅ Communes-20220101 (INSEE)
   - Format: GeoJSON (7.2 MB)
   - Records: 34,965 communes
   - Downloads: 15,234 last month
   → Recommended ★★★★★
   
2. Communes Simplifiées (INSEE)
   - Format: GeoJSON (2.1 MB, simplified)
   - Records: 34,965 communes
   → Good if file size matters ★★★★

3. Communes (Shapefile) - IGN
   - Format: Shapefile (requires conversion)
   - Records: 35,412 communes
   → Convert to GeoJSON first ★★★
```

### Step 3: Ask Claude to Add to Your Atlas

```
Download the first one and add it to my atlas with nice styling
```

Claude will:
1. Fetch the GeoJSON file from data.gouv.fr
2. Save to `public/data/communes.geojson`
3. Update `src/config.ts` with proper layer config
4. Add colors, tooltips, detail builders
5. Reload your browser
6. Show you the result on the map

### Step 4: Customize (Optional)

If you want different colors or details:

```
Change the communes color to green and add population to the details
```

Done! 🎉

---

## Alternative: Ask Claude Directly (No Skill)

If you prefer not to use the skill, just ask Claude normally:

```
Find me a French communes dataset on data.gouv.fr in GeoJSON format
```

Claude has datagouv MCP enabled and will:
1. Search data.gouv.fr
2. Return candidates
3. Download and configure for you

Same result, just without the skill's geo-optimizations.

---

## Method 2: Manual Search (Slower, Learning-Focused)

**Time:** 10-15 minutes per dataset

Use this when Claude Code is unavailable, or to understand how data discovery works.

### Step 1: Search data.gouv.fr

Visit https://www.data.gouv.fr

Search for your topic:
```
communes boundaries
```

### Step 2: Filter by Format

Look for **GeoJSON** resources (easiest to use directly).

If you only see Shapefile or CSV:
- Download it anyway
- You'll need a tool to convert (GDAL, Mapshaper)
- Or ask Claude Code: "Convert this Shapefile to GeoJSON"

### Step 3: Download Resource

Click the resource link to download the file.

Naming: Save with a clear name:
```
communes.geojson  ✓ Good
data.geojson      ✗ Too generic
communes_full.geojson_v2.bak  ✗ Too confusing
```

### Step 4: Move to Your Project

```bash
# Move downloaded file to public/data/
mv ~/Downloads/communes.geojson public/data/
```

### Step 5: Validate

```bash
npm run validate-config
```

Expected: `✓ communes.geojson: Valid GeoJSON`

### Step 6: Update Config

Edit `src/config.ts`:

```typescript
layerGroups: [
  {
    group: 'Administrative',
    layers: [
      {
        id: 'communes',
        label: 'Communes',
        file: 'data/communes.geojson',  // ← your file
        active: true,
      },
    ],
  },
],
```

Add styles:
```typescript
styles: {
  communes: {
    color: '#1f2937',
    weight: 1,
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
  },
},
```

### Step 7: Test

Reload http://localhost:5173. Your layer should appear.

---

## Common Datasets for French Projects

| Data | Query | Format | Where |
|------|-------|--------|-------|
| Communes | "communes boundaries" | GeoJSON | data.gouv.fr |
| Regions | "regions administratives" | GeoJSON | data.gouv.fr |
| Parks | "parcs naturels" | Mixed (may need conversion) | data.gouv.fr |
| Buildings | "bâtiments" | GeoJSON/WFS | IGN + data.gouv.fr |
| Roads | "routes nationales" | GeoJSON | data.gouv.fr |
| Water | "cours d'eau" | GeoJSON | data.gouv.fr |

## Troubleshooting

**"No GeoJSON options available"**
- Look for Shapefile or GeoPackage as fallback
- Ask Claude Code: "Convert this [format] to GeoJSON"
- Try alternative datasets

**"File is huge (100+ MB)"**
- Use Mapshaper to simplify: https://mapshaper.org/
- Ask Claude Code: "Simplify this GeoJSON to 10% size"

**"Layer doesn't appear on map"**
1. Check file path in `src/config.ts`
2. Validate: `npm run validate-config`
3. Check browser console (F12) for errors
4. Zoom out — data might be outside current viewport

**"GeoJSON layer is too detailed (slow map)"**
- Simplify via Mapshaper
- Or wait for Phase 3 (sources.json pattern) which handles auto-simplification

---

**Need more help?** Check `docs/how-to/customize-styling.md` after adding your first layer.
