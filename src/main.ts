import 'leaflet/dist/leaflet.css'
import 'leaflet-atlas/css'
import './css/app.css'

import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapApp } from 'leaflet-atlas'
import { config } from './config'

// Leaflet's default icon path auto-detection breaks once Vite inlines the
// marker images as base64 data URIs in production builds, causing 404s for
// the retina/shadow assets. Drop the auto-detecting `_getIconUrl` override
// and set the URLs explicitly so Vite resolves them as real assets instead.
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Initialize the atlas
const app = new MapApp(config)

// Export for debugging in browser console
;(window as any).app = app
