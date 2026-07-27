# Getting Started

Welcome to Points Chauds France! This tutorial walks you through running the
project locally in a few minutes.

## Prerequisites

- Node.js 22+ and npm
- Git
- (Optional, only to refresh data yourself) a free NASA FIRMS API key

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/rlespinasse/points-chauds-france
   cd points-chauds-france
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the dev server**

   ```bash
   npm run dev
   ```

4. **Open in browser**

   Vite opens `http://localhost:5173` automatically. The map loads using the
   hotspot data already committed under `public/data/` — you don't need a
   FIRMS API key just to browse the app.

## What you'll see

A map of France showing recent satellite-detected heat/fire hotspots
("points chauds"), with:

- A rolling 5-day live window of VIIRS detections (Suomi NPP, NOAA-20,
  NOAA-21), color-coded by Fire Radiative Power (FRP) intensity
- A time slider (bottom-right) to replay the last 5 days day-by-day, and to
  reach further back into the archive
- An FRP legend (bottom-left)
- Per-commune context (communes with at least one detection)
- Layer, search and legal-pages controls from
  [`leaflet-atlas`](https://github.com/rlespinasse/leaflet-atlas)

## Refreshing the data yourself (optional)

To fetch fresh detections instead of relying on the committed data, see
[Setup FIRMS API key](../how-to/setup-firms-key.md) and
[Refresh data](../how-to/refresh-data.md).

## Next steps

- [Refresh data manually](../how-to/refresh-data.md)
- [Deploy your own instance](../how-to/deploy.md)
- Read the [architecture](../explanation/architecture.md) explanation

## Need help?

Check the [reference](../reference/) section or the main
[README](../../README.md), or open an issue on
[GitHub](https://github.com/rlespinasse/points-chauds-france/issues).
