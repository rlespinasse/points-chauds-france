# Architecture: Template Design & Trade-offs

This document explains why the geopages template is structured the way it is, and the design decisions behind it.

## Core Philosophy

**Minimize friction for beginners, without sacrificing power for advanced users.**

This leads to three principles:

1. **Start simple** — Single config file, no boilerplate
2. **Upgrade gracefully** — As you grow, add layers, add sources.json, add Python
3. **Reuse patterns** — Copy from other projects, fork the template

## The Config Pattern: Simple → Complex

The template uses a **three-stage config progression**:

### Stage 1: Simple Config (1-20 layers)

**File:** `src/config.ts`

Everything in one file. Developers can see the whole atlas at a glance.

```typescript
export const config = {
  map: { ... },
  layers: [ ... ],
  styles: { ... },
  detailBuilders: () => ({ ... }),
}
```

**Why this works:**
- Quick to understand
- Easy to copy-paste between projects
- No build step (just edit and save)
- Vite HMR reloads instantly

**When to upgrade:** You have 20+ layers and want to automate

### Stage 2: Hybrid (20-50 layers)

**Files:** `data/sources.json` + `scripts/generate-config.py` + `src/config.ts`

Metadata in sources.json, generator creates JavaScript, config.ts imports and overrides.

```typescript
// src/config.ts
import { layerGroups, styles } from './generated-config.js'

export const config = {
  map: { ... },
  layerGroups,  // From generator
  styles: { ...styles, communes: { ...styles.communes, fillOpacity: 0.2 } },  // Override
  detailBuilders: customDetailBuilders,
}
```

**Why this works:**
- Single source of truth (sources.json)
- Reduces repetition for similar layers
- Can be versioned and shared
- Generator is portable (can share across projects)

**When to upgrade:** You have 50+ layers from APIs with consistent structure

### Stage 3: Fully Generated (50+ layers)

**Files:** `data/sources.json` + `scripts/generate-config.py`

All config auto-generated from sources.json.

```typescript
// src/config.ts
import config from './generated-config.js'
export { config }
```

**Why this works:**
- Minimal manual config
- Layer definitions are data, not code
- Easy to add/remove layers without touching JavaScript

**Upgrade path:** Each stage preserves the previous (config.ts still exists in Stage 2, etc.)

---

## Why Vite 8, Not 5 or 6?

**Vite 8** was chosen for:
- **Modern tooling** — Current as of 2024, won't feel outdated in 2 years
- **Future-proof** — Easier to upgrade to Vite 9, 10 later
- **Performance** — Faster builds, better HMR
- **Ecosystem** — More plugins available, better support

**Trade-off:** Developers must have Node 18+. Fair in 2024.

---

## Why TypeScript for Config?

The config file is `config.ts` (TypeScript), even though you can write plain JavaScript.

**Why TypeScript:**
- IDE autocomplete — Shows available properties
- Type checking — Catches errors before runtime
- Documentation — Each property is documented

**Why it's optional:**
- Vite compiles away the types
- You don't need to understand TypeScript
- Just follow the examples

**Trade-off:** Slightly longer setup. But IDE hints save time later.

---

## Why leaflet-atlas (Not Mapbox, Deck.gl, etc.)?

**Geopages uses leaflet-atlas** — A config-driven Leaflet wrapper we built for exactly this use case.

**Why leaflet-atlas:**
- Config-driven (matches the template philosophy)
- Lightweight (no JavaScript bloat)
- Maps data to features elegantly
- Built for French geo projects (datagouv, IGN, etc.)

**Why not:**
- **Mapbox GL:** Proprietary tiles, API keys, more overhead
- **Deck.gl:** Overkill for most geo projects, WebGL complexity
- **Leaflet directly:** Requires writing JavaScript for every feature

---

## Why Claude Code + datagouv MCP?

The template integrates Claude Code and datagouv MCP for dataset discovery.

**Why:**
- **Time saving:** 5-10 min per dataset instead of manual portal search
- **Accessibility:** Natural language ("find communes dataset") vs. form navigation
- **Skill transfer:** Helps users understand datagouv data structure

**Why it's optional:**
- Manual search still works
- `scripts/discover-dataset.mjs` documents the fallback
- All data discovery happens outside the build

---

## GitHub Pages Deployment with Smart Base Path

The template auto-detects the repo name for the GitHub Pages base path.

**Why:**
- Most GitHub Pages sites are at `https://user.github.io/repo-name/`
- Manually setting `/chronomel/` vs `/my-atlas/` is error-prone
- Auto-detection works for 95% of cases

**How it works:**
1. Development: uses `/` (root)
2. CI/CD: reads `$GITHUB_REPOSITORY` env var, extracts repo name
3. Custom: override via `VITE_BASE_PATH` secret if needed

**Trade-off:** One-time setup if you use a custom domain.

---

## File Structure: Why This Layout?

```
src/              ← All frontend code
public/data/      ← GeoJSON files (served as-is)
scripts/          ← Utilities (validate, discover, generate)
docs/             ← Diataxis-organized documentation
.claude/          ← Claude Code config
.github/          ← GitHub Actions workflows
```

**Why this structure:**
- **Familiar:** Matches Vite default structure
- **Separates concerns:** Code, data, scripts, docs
- **Scales:** Easy to add Python pipelines in root (`data/`, `scripts/`)
- **Clear:** New developers understand where things go

---

## Documentation: Diataxis Organization

Docs are split into four categories:

| Type | Purpose | Example |
|------|---------|---------|
| **Tutorials** | Learn by doing | quickstart.md |
| **How-to** | Accomplish a task | discover-datasets.md |
| **Explanation** | Understand why | architecture.md (this file) |
| **Reference** | Look up details | config-api.md |

**Why Diataxis:**
- Different user needs (learners vs. practitioners)
- Prevents mixing content (no tutorials in reference, no reference in tutorials)
- Easier to maintain (know what each doc should contain)

**Trade-off:** More docs to write. But each is focused and useful.

---

## Design Trade-offs Summary

| Choice | Benefit | Trade-off |
|--------|---------|-----------|
| config.ts (TypeScript) | IDE hints, type safety | Need to build/compile |
| Vite 8 | Modern, performant | Requires Node 18+ |
| leaflet-atlas | Config-driven, lightweight | Less customization than raw Leaflet |
| claudeCode + MCP | Fast dataset discovery | Requires Claude Code (optional) |
| GitHub Pages auto base path | Works out-of-box | Custom domains need setup |
| Diataxis docs | Focused, useful | More docs to write/maintain |

**Philosophy:** We chose features that help 80% of users, even if they don't help 100%.

---

## Future Evolution

**Phase 2 (Planned):**
- Custom skill for datagouv discovery
- PostSave hooks for auto-validation
- TypeScript defs for leaflet-atlas

**Phase 3 (Planned):**
- sources.json + generator (for scaling)
- Optional Python data pipeline
- Multi-language support

**Phase 4+ (Vision):**
- Web editor for non-developers
- Live data fetching (APIs instead of static GeoJSON)
- Collaborative editing (multiple mapmakers)

---

**Questions?** Ask Claude Code: "Why is [feature] designed this way?"
