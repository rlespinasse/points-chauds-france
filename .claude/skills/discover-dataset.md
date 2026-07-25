# geopages:discover-dataset

Search French open data for datasets and get recommendations for your atlas.

## Usage

```
/geopages:discover-dataset "communes boundaries"
/geopages:discover-dataset "what geographic datasets are available?"
/geopages:discover-dataset "buildings" --format geojson --sort downloads
```

## What It Does

1. **Search datagouv** — Queries data.gouv.fr for your search term
2. **Filter results** — Shows only geographic datasets with GeoJSON availability
3. **Rank by relevance** — Orders by download count, recency, quality
4. **Show metadata** — Displays:
   - Dataset name and description
   - Available formats (GeoJSON = ✓, Shapefile = requires conversion, etc.)
   - File size and record count
   - Update frequency
   - Download URL
5. **Recommendations** — Suggests the best match for your use case

## Examples

### Find a communes dataset
```
/geopages:discover-dataset "communes boundaries"
```

Returns:
```
Top matches for "communes boundaries":

1. ✅ Communes-20220101 (INSEE)
   - Format: GeoJSON (7.2 MB)
   - Records: 34,965 communes
   - Updated: Annually
   - Downloads: 15,234 last month
   → Recommended for new projects
   
2. Communes Simplifiées (INSEE)
   - Format: GeoJSON (2.1 MB, simplified)
   - Records: 34,965 communes
   - Updated: Annually
   → Good if file size matters

3. Communes (Shapefile) - IGN
   - Format: Shapefile (requires conversion)
   - Records: 35,412 communes
   - Updated: Quarterly
   → Convert to GeoJSON with Mapshaper
```

### Find regional administrative data
```
/geopages:discover-dataset "regions administratives"
```

### Discover what's available
```
/geopages:discover-dataset "what geographic datasets are available?"
```

Returns categories: Administrative, Natural Resources, Infrastructure, Culture, etc.

---

## Integration with Your Project

After discovering a dataset, ask Claude:

```
"Download the Communes-20220101 dataset and add it to my atlas"
```

Claude will:
1. Fetch the GeoJSON file
2. Save to `public/data/communes.geojson`
3. Update `src/config.ts` with the new layer
4. Configure styles, tooltips, detail builders
5. Verify it renders correctly

---

## Parameters

| Parameter | Example | Notes |
|-----------|---------|-------|
| Query | `"communes"` | Required. Can be keyword or natural language question |
| `--format` | `geojson` | Filter by format: geojson, shapefile, wfs, etc. |
| `--sort` | `downloads` | Sort by: downloads, recency, views, quality |
| `--limit` | `10` | Number of results (default: 5) |

---

## Tips

**Finding the right dataset:**
- Be specific: `"communes boundaries"` not just `"communes"`
- Ask questions: `"best building dataset?"`
- Combine terms: `"regions + population data"`

**For non-GeoJSON data:**
- Ask: `"convert this Shapefile to GeoJSON"`
- Claude can guide you through Mapshaper or GDAL
- Or: `"which datasets have GeoJSON?"` (filters format)

**For datasets outside France:**
- Ask: `"find buildings dataset for Germany"` → manually search (datagouv is FR-only)
- Or ask Claude: `"where to find German geographic data?"`

---

## What This Skill Uses

Behind the scenes, this skill:
- Uses `mcp__datagouv__search_datasets` (datagouv MCP)
- Filters and ranks results
- Provides context for your geo project
- Integrates recommendations into your workflow

---

## See Also

- `docs/how-to/discover-datasets.md` — Step-by-step guide
- `docs/explanation/datagouv-integration.md` — Why MCP matters
- `docs/tutorials/create-first-project.md` — Full walkthrough including data discovery
