# Frequently Asked Questions

### Why isn't my layer showing?

1. Check file path in `config.ts` matches actual file: `public/data/my-file.geojson`
2. Validate GeoJSON: `npm run validate-config`
3. Check browser console (F12) for errors
4. Zoom out — data might be outside current viewport

### How do I add more base layers?

Add entries to `baseLayers` in `src/config.ts`:

```typescript
baseLayers: {
  'OpenStreetMap': { ... },
  'Satellite': { ... },
  'My Custom Tiles': {
    url: 'https://...',
    options: { attribution: '...', maxZoom: 18 },
  },
},
```

### How do I change the map center or zoom?

Edit `src/config.ts`:

```typescript
map: {
  center: [48.8566, 2.3522],  // Change this
  zoom: 12,                   // And this
},
```

### Can I use non-GeoJSON data?

Not directly. Convert first:
- Shapefile → GeoJSON: Use Mapshaper or GDAL
- CSV with lat/lng → GeoJSON: Use Claude Code
- WFS endpoint → GeoJSON: Ask Claude Code

### How do I deploy a custom domain?

See GitHub Pages docs on custom domains. The template supports any domain via DNS settings.

*More FAQs coming in Phase 1 completion.*
