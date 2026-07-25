# Tutorial: Create Your First Geo Project

In this tutorial, we'll create a complete geo atlas from scratch: clone template → add real data → customize → deploy.

**Time:** ~20 minutes | **Result:** A live atlas on GitHub Pages

## Before You Begin

- Node.js 18+ and npm/pnpm installed
- A GitHub account
- 20 minutes of time

This tutorial assumes you've already done `npm install` and `npm run dev` (see quickstart.md if not).

## Step 1: Choose Your Data (3 minutes)

We'll add real French administrative data. You have two options:

**Option A: Use Claude Code (Recommended, faster)**
- Opens your project in Claude Code
- Ask: `"Find French communes boundaries dataset"`
- Claude queries datagouv MCP, returns candidates
- Download the best match

**Option B: Manual search (5 minutes)**
- Visit [data.gouv.fr](https://www.data.gouv.fr)
- Search: "communes boundaries" or "communes-20220101"
- Download as GeoJSON

For this tutorial, we'll assume you have a GeoJSON file: `communes.geojson` (~1 MB)

## Step 2: Add Your Data (2 minutes)

1. **Move GeoJSON to your project:**
   ```bash
   # Copy your downloaded file to the data directory
   cp ~/Downloads/communes.geojson public/data/
   ```

2. **Verify it's valid:**
   ```bash
   npm run validate-config
   ```

   Expected: `✓ communes.geojson: Valid GeoJSON`

## Step 3: Update Config (5 minutes)

Open `src/config.ts` and replace the sample layer with your communes layer.

Find this section:
```typescript
layerGroups: [
  {
    group: 'Sample',
    layers: [
      {
        id: 'sample',
        label: 'Sample Layer',
        file: 'data/sample-layer.geojson',
        active: true,
      },
    ],
  },
],
```

Replace with:
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
    ],
  },
],
```

Now update the styles. Find:
```typescript
styles: {
  sample: { ... },
},
```

Replace with:
```typescript
styles: {
  communes: {
    color: '#1f2937',
    weight: 1,
    opacity: 0.8,
    fill: true,
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
  },
},
```

And the tooltips:
```typescript
tooltips: {
  communes: (p) => p.nom || 'Commune',
},
```

And the detail builder:
```typescript
detailBuilders: () => ({
  communes: (p) => `
    <h2>${p.nom || 'Commune'}</h2>
    <dl>
      <dt>Code</dt><dd>${p.code || '-'}</dd>
      <dt>Region</dt><dd>${p.region || '-'}</dd>
    </dl>
  `,
}),
```

**Save the file.** Your browser automatically reloads (Vite watches for changes).

## Step 4: Verify on Map (2 minutes)

1. **Look at http://localhost:5173**
2. **You should see:**
   - French communes boundaries on the map
   - Layer toggle in top-right (should say "Communes")
   - Hover over a commune → tooltip shows name
   - Click a commune → detail panel shows

If you don't see anything, check:
- File name matches: `data/communes.geojson`
- GeoJSON is valid: `npm run validate-config`
- Check browser console for errors (F12)

## Step 5: Customize Title & Colors (3 minutes)

Make it your own by editing the title and colors:

```typescript
title: {
  heading: 'French Communes Atlas',
  subtitle: 'Interactive map of French administrative divisions',
  icon: 'favicon.svg',
},
```

Try different colors for `styles.communes.fillColor`:
- Blue: `#3b82f6`
- Green: `#10b981`
- Purple: `#8b5cf6`
- Red: `#ef4444`

Save and see changes instantly.

## Step 6: Deploy to GitHub Pages (3 minutes)

1. **Create a GitHub repo:**
   - Go to [github.com/new](https://github.com/new)
   - Name it `communes-atlas` (or your project name)
   - Do NOT initialize with README (we have one)
   - Create repository

2. **Push your code:**
   ```bash
   git init
   git add .
   git commit -m "init: French communes atlas"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/communes-atlas.git
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to your repo → Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages (auto-created by workflow)
   - Save

4. **Wait 1-2 minutes** for the first deploy

5. **Your atlas is live!** Visit:
   ```
   https://YOUR-USERNAME.github.io/communes-atlas/
   ```

## What You've Built

You now have:
- ✅ A working geo atlas with real French administrative data
- ✅ Interactive layers, search, hover tooltips, click details
- ✅ Automatic deployment to GitHub Pages
- ✅ A foundation to add more layers

## Next Steps

**Add more layers?**
- See `docs/how-to/discover-datasets.md` to find more French datasets
- Repeat steps 2-4 for each layer

**Customize styling?**
- See `docs/how-to/customize-styling.md`

**Scale to many layers (20+)?**
- See `docs/how-to/scale-to-complex.md` (sources.json pattern)

**Deploy to custom domain?**
- See `docs/how-to/deploy-to-github-pages.md`

## Troubleshooting

**Map is blank after editing config?**
- Check browser console (F12) for errors
- Verify GeoJSON file path matches: `file: 'data/communes.geojson'`
- Validate GeoJSON: `npm run validate-config`

**Deployment failed?**
- Check GitHub Actions tab in your repo
- Click the failed workflow to see error logs
- Most common: missing package.json scripts

**Need help?**
- See `docs/reference/faq.md`
- Ask Claude Code: "Why isn't my layer showing?"

---

**Congratulations!** You've built and deployed a geo atlas. 🗺️
