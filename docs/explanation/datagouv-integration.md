# datagouv Integration: Why MCP Matters

This document explains why datagouv MCP (Model Context Protocol) is integrated and how it accelerates your workflow.

## The Problem: Dataset Discovery Takes Time

**Without MCP:**
1. Visit data.gouv.fr portal (site loads slowly)
2. Enter search term
3. Browse results (unclear which are GeoJSON)
4. Click resource, read metadata
5. Download file (may be Shapefile, CSV, or GeoJSON)
6. Manually add to project

**Time cost:** 10-15 minutes per dataset

**With datagouv MCP:**
1. Ask Claude Code: `"Find communes boundaries dataset"`
2. MCP queries data.gouv.fr API instantly
3. Claude returns top 3 matches with:
   - Dataset name + description
   - Available formats (GeoJSON ✓ or Shapefile ✗)
   - Download URL
   - Dataset ID + resource ID (for metadata)
4. Ask: `"Add the first one to my atlas"`
5. Claude downloads → saves to `public/data/` → updates `config.ts`

**Time cost:** 3-5 minutes per dataset

**Savings:** ~10 minutes per dataset × 5 datasets = 50 minutes saved per project

---

## How datagouv MCP Works

**datagouv MCP** is a Model Context Protocol server that Claude can query:

```
Claude (in Claude Code)
    ↓
datagouv MCP Server
    ↓
data.gouv.fr API
    ↓
Returns: [Datasets matching "communes boundaries"]
```

**What Claude can do:**
- Search datasets by keyword
- List resources in a dataset
- Get detailed metadata
- Fetch OpenAPI specs for APIs
- Check download stats

**All without leaving Claude Code chat.**

---

## Why This Template Integrates It

**1. Realistic Use Case**
- Most geo projects start with finding data
- datagouv is THE French open data source
- Integration makes this frictionless

**2. Demonstrates MCP Value**
- Shows how AI can speed up workflows
- Concrete example of Claude helping with actual work
- Encourages adopting Claude Code for data projects

**3. Reduces Context Switching**
- Stay in Claude Code editor
- Don't jump between browser + terminal + IDE
- Faster feedback loop

---

## When You'll Use This

### Scenario 1: Building Your First Atlas
```
Developer: "I want to add French communes to my atlas"
Claude: (queries datagouv) "Found 5 datasets..."
Developer: "Add the best one"
Claude: Downloads + configures → Done
```
**Result:** 5 minutes instead of 15

### Scenario 2: Adding Related Data
```
Developer: "What other administrative datasets are available?"
Claude: (queries datagouv) "Regions, departments, towns..."
Developer: "Add regions too"
Claude: Downloads + adds layer → Done
```
**Result:** Build richer atlas faster

### Scenario 3: Discovering New Data
```
Developer: "What building datasets exist?"
Claude: (queries datagouv) "IGN buildings, OSM buildings, cadastre..."
Developer: "Which is most complete?"
Claude: Returns comparison + recommendations
```
**Result:** Data-driven decision making

---

## Setup

The template has datagouv MCP pre-configured in `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__datagouv__search_datasets",
      "mcp__datagouv__list_dataset_resources",
      "mcp__datagouv__get_resource_info"
    ]
  }
}
```

When you open this project in Claude Code, datagouv MCP is automatically available.

---

## Custom Skill: geopages:discover-dataset

The template includes an optional custom skill that wraps datagouv MCP:

**Usage:**
```
/geopages:discover-dataset "communes boundaries"
```

**What it does:**
1. Queries datagouv for "communes boundaries"
2. Returns top matches with ratings
3. Shows GeoJSON availability
4. Gives download recommendations

**Why custom skill?**
- Optimized for geo projects
- Consistent interface
- Remembers geopages patterns
- Can be extended (e.g., auto-simplification)

---

## Limitations & Workarounds

**datagouv MCP limitations:**
- Only French data (data.gouv.fr)
- May not have all specialized datasets
- APIs sometimes change

**Workarounds:**
- Manual search for non-French data (data.gov, World Bank, etc.)
- Ask Claude to convert non-GeoJSON formats
- Combine multiple datasets via scripts

---

## Future Enhancements

**Phase 3+ possibilities:**
- Auto-fetch + simplify large GeoJSON files
- Preview datasets on map before adding
- Generate sources.json automatically
- Multi-country support (data.europa.eu, etc.)
- Integration with WFS endpoints

---

## TL;DR

**datagouv MCP = Faster dataset discovery**

- Ask Claude instead of clicking portals
- Save 10 minutes per dataset
- Build richer atlases in same time
- Stay in Claude Code

**Try it:** Open this project in Claude Code and ask:
```
"Find a French communes dataset and show me the options"
```

---

See `docs/how-to/discover-datasets.md` for step-by-step usage.
