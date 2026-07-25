/**
 * Validate GeoJSON files in public/data/
 * Run: npm run validate-config
 */

import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../public/data')

async function validateGeoJSON() {
  try {
    const files = await readdir(dataDir)
    const geojsonFiles = files.filter(f => f.endsWith('.geojson'))

    if (geojsonFiles.length === 0) {
      console.log('✓ No GeoJSON files to validate')
      return
    }

    let hasErrors = false

    for (const file of geojsonFiles) {
      try {
        const content = await readFile(path.join(dataDir, file), 'utf-8')
        const geojson = JSON.parse(content)

        if (!geojson.type) {
          console.error(`✗ ${file}: Missing 'type' property`)
          hasErrors = true
        } else if (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature') {
          console.error(`✗ ${file}: Invalid type '${geojson.type}'`)
          hasErrors = true
        } else {
          console.log(`✓ ${file}: Valid GeoJSON`)
        }
      } catch (err) {
        console.error(`✗ ${file}: Invalid JSON - ${err.message}`)
        hasErrors = true
      }
    }

    if (hasErrors) {
      process.exit(1)
    }
  } catch (err) {
    console.error('Error validating GeoJSON:', err.message)
    process.exit(1)
  }
}

validateGeoJSON()
