# Configuration Patterns: Simple vs. Complex

This document explains when to use simple `config.ts` vs. the two-stage `sources.json` pattern, and how to know which is right for your project.

## Three Stages of Configuration

The geopages template supports three configuration approaches that scale with your project:

### Stage 1: Simple Config (1-20 layers)

**All config in one file: `src/config.ts`**

```typescript
export const config = {
  map: { ... },
  layerGroups: [
    { group: 'Admin', layers: [
      { id: 'communes', label: 'Communes', file: 'data/communes.geojson', active: true },
      { id: 'regions', label: 'Regions', file: 'data/regions.geojson', active: false },
    ]},
    { group: 'Natural', layers: [
      { id: 'forests', label: 'Forests', file: 'data/forests.geojson', active: false },
    ]},
  ],
  styles: {
    communes: { color: '#1f2937', fill: true, fillColor: '#3b82f6', fillOpacity: 0.1 },
    regions: { color: '#059669', fill: true, fillColor: '#10b981', fillOpacity: 0.15 },
    forests: { color: '#166534', fill: true, fillColor: '#22c55e', fillOpacity: 0.3 },
  },
  tooltips: {
    communes: (p) => p.nom,
    regions: (p) => p.nom,
    forests: (p) => p.type,
  },
  // ... rest of config
}
```

**When to use:**
- ✅ You have 1-20 layers
- ✅ Layers are diverse (different styles, sources)
- ✅ You want simplicity and full control
- ✅ You're building a single-purpose atlas

**Advantages:**
- Simple, readable, all in one place
- Full IDE support + autocomplete
- Easy to customize individual layers
- No build step

**Disadvantages:**
- Repetitive for similar layers
- Hard to share config between projects
- Manual work increases with layer count

---

### Stage 2: Hybrid Pattern (20-50 layers)

**Metadata in `data/sources.json` + Generator → `src/generated-config.js` + Manual overrides in `src/config.ts`**

Structure:
```
data/sources.json          ← Layer definitions (metadata-driven)
  ↓ (npm run generate)
src/generated-config.js    ← Auto-generated layerGroups, styles, tooltips
  ↓ (import in config.ts)
src/config.ts              ← Import + customize as needed
```

Example `data/sources.json`:
```json
{
  "layers": {
    "administrative/communes": {
      "name": "Communes",
      "file": "communes.geojson",
      "geometry_type": "polygon",
      "style": { "color": "#1f2937", "fill": true, "fillColor": "#3b82f6", "fillOpacity": 0.1 },
      "tooltip_field": "nom",
      "active": true
    },
    "administrative/regions": {
      "name": "Regions",
      "file": "regions.geojson",
      "geometry_type": "polygon",
      "style": { "color": "#059669", "fill": true, "fillColor": "#10b981", "fillOpacity": 0.15 },
      "tooltip_field": "nom",
      "active": false
    }
  }
}
```

Then in `src/config.ts`:
```typescript
import { layerGroups, styles, tooltips } from './generated-config.js'

export const config = {
  map: { ... },
  layerGroups,  // Auto-generated
  styles,       // Auto-generated
  tooltips,     // Auto-generated
  detailBuilders: customDetailBuilders,  // Manual
  // ... rest
}
```

**When to use:**
- ✅ You have 20-50 layers
- ✅ Many layers have similar structure
- ✅ You want to avoid repetition
- ✅ You might share config between projects

**Advantages:**
- Single source of truth (sources.json)
- Reduces repetition dramatically
- Easy to add new layers (just add to JSON)
- Portable (can share sources.json)
- Generator is reusable

**Disadvantages:**
- Requires Python script
- Slightly more complex workflow
- Not every layer might fit the pattern

---

### Stage 3: Fully Generated (50+ layers)

**All config auto-generated, import directly**

```typescript
// src/config.ts
import config from './generated-config.js'
export { config }
```

**When to use:**
- ✅ You have 50+ similar layers
- ✅ Layers follow a consistent pattern
- ✅ You're building a comprehensive regional atlas
- ✅ Configuration is very repetitive

**Advantages:**
- Minimal manual code
- Extremely DRY
- Easy to bulk-add layers

**Disadvantages:**
- Less flexibility for custom layers
- All customization in JSON

---

## Decision Tree

**How many layers do you have/need?**

1-10 layers?
→ **Stage 1** (Simple `config.ts`)
→ Everything in one file, easy to understand

10-20 layers?
→ **Still Stage 1**, but start thinking about Stage 2
→ If adding layers feels repetitive, upgrade

20-40 layers?
→ **Stage 2** (Hybrid with sources.json)
→ Use generator for base config, customize as needed

40+ layers?
→ **Stage 2 or 3** depending on diversity
→ If layers are similar, use full generation
→ If layers are diverse, use hybrid

---

## Migration Path

**You can upgrade without breaking anything:**

1. **Start with Stage 1** — Simple `config.ts`
2. **When you have 15 layers:**
   - Create `data/sources.json`
   - Run `npm run generate`
   - Move generated config to `generated-config.js`
   - Import in `config.ts`
   - Everything still works
3. **Keep evolving** — Add more layers to JSON, regenerate

Example of keeping Stage 1 alongside generated:
```typescript
import { layerGroups as generatedLayers, styles as generatedStyles } from './generated-config.js'

// Mix: auto-generated + manual layers
layerGroups: [
  ...generatedLayers,  // Spread generated groups
  {
    group: 'Custom',
    layers: [
      { id: 'custom', label: 'My Custom Layer', file: 'data/custom.geojson' }
    ]
  }
],
styles: {
  ...generatedStyles,  // Spread generated styles
  custom: { ... }      // Add custom
}
```

---

## Comparing Approaches

| Aspect | Stage 1 (Simple) | Stage 2 (Hybrid) | Stage 3 (Generated) |
|--------|-----------------|-----------------|-------------------|
| **Layers** | 1-20 | 20-50 | 50+ |
| **Setup** | Just config.ts | sources.json + generator | sources.json + generator |
| **Repetition** | Some | Minimal | None |
| **Customization** | Full | High | Medium |
| **Learning curve** | Easy | Medium | Medium |
| **IDE support** | Excellent | Good | Fair |
| **Reusability** | Low | High | High |

---

## Recommendation

**Start with Stage 1.** It's simple and works great for small-to-medium projects.

**Upgrade to Stage 2 when:**
- You feel like you're copy-pasting layer definitions
- You have 15+ similar layers
- You want to share config across projects

**Move to Stage 3 only if:**
- You have 50+ very similar layers
- You're building a comprehensive regional/national atlas

---

## See Also

- `docs/how-to/scale-to-complex.md` — Step-by-step upgrade guide
- `docs/reference/sources-schema.md` — sources.json format reference
- `scripts/generate-config.py` — The generator script
