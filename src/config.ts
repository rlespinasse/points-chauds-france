/**
 * Geopages Atlas Configuration
 *
 * This is the main configuration file for your geo atlas.
 * Customize it to add your own layers, styles, and details.
 *
 * For complete API reference, see: docs/reference/config-api.md
 */

export const config = {
  // ============= MAP ============= //
  map: {
    elementId: 'map',           // HTML element ID where map mounts
    center: [46.6, 2.5],        // Initial center [lat, lng]
    zoom: 6,                    // Initial zoom level
  },

  // ============= TITLE ============= //
  title: {
    heading: 'My Geo Atlas',
    subtitle: 'Interactive map of interesting places',
    icon: 'favicon.svg',
  },

  // ============= BASE LAYERS (Tile services) ============= //
  baseLayers: {
    'OpenStreetMap': {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      },
    },
    'Satellite': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        attribution: '© Esri',
        maxZoom: 18,
      },
    },
  },
  defaultBaseLayer: 'OpenStreetMap',

  // ============= DATA LAYERS ============= //
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

  // ============= STYLES ============= //
  styles: {
    sample: {
      color: '#1f2937',
      weight: 2,
      opacity: 0.8,
      fill: true,
      fillColor: '#10b981',
      fillOpacity: 0.3,
    },
  },

  // ============= TOOLTIPS (Hover) ============= //
  tooltips: {
    sample: (properties) => {
      const name = properties.name || 'Feature'
      return `<strong>${name}</strong>`
    },
  },

  // ============= DETAIL BUILDERS (Click to view details) ============= //
  detailBuilders: () => ({
    sample: (properties) => `
      <h2>${properties.name || 'Sample Feature'}</h2>
      <p>This is the detail panel that appears when you click a feature.</p>
      <dl>
        ${Object.entries(properties)
          .map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`)
          .join('')}
      </dl>
    `,
  }),

  // ============= LEGAL PAGES (About, Data sources, etc.) ============= //
  legalPages: [
    {
      id: 'about',
      label: 'About',
      content: `
        <h2>About This Atlas</h2>
        <p>This is a sample geo atlas created with geopages.</p>
        <h3>Data Sources</h3>
        <ul>
          <li>Sample data: Public domain</li>
        </ul>
      `,
    },
  ],
}
