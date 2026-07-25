# Geopages Template

Create interactive geodata atlases in minutes, not hours.

**Turn a geo idea into a live map in ~15 minutes:**
1. Clone template (2 min)
2. Add GeoJSON data (5 min)
3. Configure in `src/config.ts` (5 min)
4. Push to GitHub → Auto-deploy (1 min)

## What You Get

- ✅ **Instant setup:** Vite 8 + TypeScript, ready to go
- ✅ **Leaflet-atlas integration:** Config-driven map framework
- ✅ **datagouv MCP:** Search & fetch French open data instantly (in Claude Code)
- ✅ **GitHub Pages ready:** Auto-deploy on push
- ✅ **Scale smoothly:** Simple config → sources.json + generation when you grow

## Quick Start

### 1. Clone Template

```bash
git clone https://github.com/rlespinasse/geopages-template my-atlas
cd my-atlas
npm install
npm run dev
```

Opens http://localhost:5173 with a sample layer.

### 2. Choose Your Path

**New to Geo? Follow the Learning Path:**
- Read `docs/tutorials/quickstart.md` (5 min)
- Follow `docs/tutorials/create-first-project.md` (15 min)
- Understand `docs/explanation/architecture.md`

**Experienced? Go straight to work:**
- Reference `docs/reference/config-api.md` for API details
- Use `docs/how-to/` guides for specific tasks
- Check `docs/reference/faq.md` for troubleshooting

**Scaling your project?**
- Read `docs/explanation/config-patterns.md` to understand when to upgrade
- Follow `docs/how-to/scale-to-complex.md` to add sources.json

## What's Inside

```
src/
  ├─ config.ts          ← Your main config (layers, styles, details)
  ├─ main.ts            ← Entry point
  └─ css/
      └─ app.css        ← Project CSS

public/data/
  └─ *.geojson          ← Your GeoJSON files

docs/
  ├─ tutorials/         ← Learn-by-doing guides
  ├─ how-to/            ← Accomplish specific tasks
  ├─ explanation/       ← Understand design choices
  └─ reference/         ← API lookups & schemas
```

## Adding Your First Layer

1. **Get GeoJSON data:**
   - Download from [data.gouv.fr](https://www.data.gouv.fr)
   - Or use Claude Code: `"Find communes dataset"` (datagouv MCP will help)

2. **Save to `public/data/`:**
   ```bash
   mv my-data.geojson public/data/
   ```

3. **Reference in `src/config.ts`:**
   ```typescript
   layerGroups: [
     {
       group: 'My Data',
       layers: [
         {
           id: 'communes',
           label: 'Communes',
           file: 'data/my-data.geojson',
           active: true,
         },
       ],
     },
   ],
   ```

4. **Reload browser** → Done! Layer appears on map.

## Using datagouv MCP (in Claude Code)

The template has datagouv MCP pre-configured with a custom skill for geo projects.

### Quick Method: Use the Custom Skill

```
/geopages:discover-dataset "communes boundaries"
```

Returns ranked options with download links. Then:

```
"Download the first one and add it to my atlas"
```

Claude: Downloads → Saves to `public/data/` → Updates `config.ts` → Renders on map

### Direct Method: Ask Claude

If you prefer not to use the skill:

```
me: "Find communes boundaries dataset"

Claude: Queries datagouv → Returns top matches

me: "Add the first one to my atlas"

Claude: Downloads → Saves → Updates config
```

**Time saved:** 5-10 minutes per dataset (vs. manual portal browsing)

See `docs/how-to/discover-datasets.md` for full guide.

## Building for Production

```bash
npm run build
git push  # Auto-deploys to GitHub Pages
```

Your atlas is live at: `https://yourname.github.io/repo-name/`

## Documentation Structure

Docs are organized by [Diataxis](https://diataxis.fr/) principles:

| Type | When | Example |
|------|------|---------|
| **Tutorials** | Learning from scratch | `docs/tutorials/quickstart.md` |
| **How-to** | Accomplish a task | `docs/how-to/customize-styling.md` |
| **Explanation** | Understand concepts | `docs/explanation/architecture.md` |
| **Reference** | Look up details | `docs/reference/config-api.md` |

Choose the right doc for your situation.

## Project Configuration

Edit `src/config.ts` to customize:

- **Map:** Center, zoom, projection
- **Layers:** Add/remove/style your GeoJSON data
- **Tooltips:** What appears on hover
- **Details:** What appears on click
- **Base layers:** Switch between tile services
- **About:** Legal, data sources, credits

See `docs/reference/config-api.md` for full API.

## Scaling to Complex Projects

When you have 20+ layers:

1. Create `data/sources.json` with layer metadata
2. Create `scripts/generate-config.py` to auto-generate config
3. Follow `docs/how-to/scale-to-complex.md`

This separates data definitions from site config, making it easier to manage.

## Contributing

To improve the template:

1. Make changes in your clone
2. Test thoroughly
3. Submit PR to `rlespinasse/geopages-template`

See `CONTRIBUTING.md` for details.

## Help & Documentation

- **Quick help:** `docs/tutorials/quickstart.md`
- **Full walkthrough:** `docs/tutorials/create-first-project.md`
- **How-to guides:** `docs/how-to/`
- **API reference:** `docs/reference/config-api.md`
- **Design decisions:** `docs/explanation/`
- **Common issues:** `docs/reference/faq.md`

## License

MIT

---

**Ready to build your first atlas?** Start with `docs/tutorials/quickstart.md`
