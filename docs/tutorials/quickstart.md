# Quickstart: 5-Minute Setup

In this tutorial, we'll get a working geo atlas running in 5 minutes.

## Before You Begin

- Node.js 18+ ([download](https://nodejs.org))
- A terminal
- A web browser

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the template
git clone https://github.com/rlespinasse/geopages-template my-atlas
cd my-atlas

# Install dependencies
npm install
```

Expected output: `added 123 packages`

## Step 2: Start Dev Server (1 minute)

```bash
npm run dev
```

Expected output:
```
VITE v8.0.16  ready in 543 ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

Your default browser opens automatically. You should see a map with a sample layer (three French cities: Paris, Lyon, Marseille).

## Step 3: Verify Interactivity (2 minutes)

1. **Hover over cities** → Tooltips appear ("Paris", "Lyon", "Marseille")
2. **Click a city** → Detail panel opens on the right with properties
3. **Use the layer control** → Top-right corner, toggle "Sample Layer" on/off
4. **Switch base layers** → Top-right, click "OpenStreetMap" → "Satellite"

You now have a working atlas! 🎉

## What You've Built

You have a functional map with:
- Interactive layers (toggle visibility)
- Hover tooltips
- Click-to-view details
- Multiple base layers (satellite, street map)

## Next Steps

To learn how to add your own data:
- See `docs/tutorials/create-first-project.md` for a full end-to-end walkthrough
- Or jump straight to `docs/how-to/discover-datasets.md` to find real data

To customize the map:
- Edit `src/config.ts` (all settings are there)
- See `docs/reference/config-api.md` for API reference

## Troubleshooting

**Port 5173 already in use?**
```bash
npm run dev -- --port 5174
```

**Styles not loading?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Need help?** Check `docs/reference/faq.md` or `docs/how-to/` guides.
