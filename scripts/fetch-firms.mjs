/**
 * Fetch near-real-time active fire hotspots (NASA FIRMS) over France,
 * resolve each point to its commune (geo.api.gouv.fr, no API key), and
 * convert the result to GeoJSON.
 *
 * geo.api.gouv.fr does true point-in-polygon commune lookup, unlike BAN
 * address reverse-geocoding — which fails for remote points far from any
 * building, exactly the points a hotspot map cares about.
 *
 * The FIRMS bounding box also covers parts of neighboring countries
 * (Belgium, Switzerland, Spain, Italy...); points that don't resolve to
 * a French commune are dropped.
 *
 * Requires a free FIRMS MAP_KEY: https://firms.modaps.eosdis.nasa.gov/api/map_key/
 * Run: FIRMS_MAP_KEY=xxxx npm run fetch-firms
 *
 * One-off backfill of older archive days (beyond what the 3h cron run has
 * accumulated), limited by however much NRT retention FIRMS still has:
 * FIRMS_MAP_KEY=xxxx FIRMS_BACKFILL_DAYS=30 npm run fetch-firms
 */

import { readFile, writeFile, readdir, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../public/data')
// Commune lookup results, keyed by rounded coordinates — without this,
// refetching a 5-day window every 3h (cron) would re-geocode almost every
// point on every run, since consecutive runs' windows overlap by ~5/6.
const communeCacheFile = path.join(__dirname, '../data/commune-cache.json')
// FIRMS only serves a 5-day window per request (see DAY_RANGE below); this
// directory accumulates our own longer history across runs, one file per
// calendar day, so "beyond 5 days" relies on what we've fetched ourselves
// rather than on FIRMS. Lives under public/ (not data/) so Vite/Pages serves
// it and the frontend time slider (src/main.ts) can lazily fetch past days.
const archiveDir = path.join(__dirname, '../public/data/archive')
const ARCHIVE_MAX_AGE_DAYS = 90

// West, South, East, North — mainland France + Corsica
const AREA = '-5.5,41.0,10.0,51.5'
// VIIRS is a polar-orbiting instrument (~2 passes/day per satellite over a
// given spot). Querying all 3 VIIRS satellites raises coverage to ~5-6
// passes/day instead of ~2.
const SOURCES = ['VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT']
// FIRMS area API caps this at 5 (returns "Invalid day range. Expects [1..5]."
// beyond that) — gives the frontend 5 days of history for the time slider
// (see src/main.ts) instead of just the latest 24h.
const DAY_RANGE = 5
const COMMUNE_LOOKUP_URL = 'https://geo.api.gouv.fr/communes'
const COMMUNE_LOOKUP_CONCURRENCY = 15
const communesOutputFile = path.join(dataDir, 'communes-context.geojson')
const COMMUNE_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function coordKey(feature) {
  const [lon, lat] = feature.geometry.coordinates
  return `${lon.toFixed(4)},${lat.toFixed(4)}`
}

async function loadCache(file, maxAgeMs, purgeLabel) {
  let cache
  try {
    cache = JSON.parse(await readFile(file, 'utf-8'))
  } catch {
    return {}
  }

  const cutoff = Date.now() - maxAgeMs
  let purged = 0
  for (const [key, entry] of Object.entries(cache)) {
    if (entry.lastSeen < cutoff) {
      delete cache[key]
      purged += 1
    }
  }
  if (purged > 0) console.log(`  (purged ${purged} cache entry(ies) unseen for ${purgeLabel})`)

  return cache
}

const loadCommuneCache = () => loadCache(communeCacheFile, COMMUNE_CACHE_MAX_AGE_MS, '30+ days')

// Fire Radiative Power (MW) buckets — leaflet-atlas styles a whole layer
// at once, so the "color scale" is implemented as one file per bucket.
const FRP_BUCKETS = [
  { id: 'faible', max: 5 },
  { id: 'moderee', max: 20 },
  { id: 'forte', max: Infinity },
]

function csvToGeoJSON(csv) {
  const lines = csv.trim().split('\n')
  const header = lines[0].split(',').map((h) => h.trim())
  const latIdx = header.indexOf('latitude')
  const lonIdx = header.indexOf('longitude')

  const features = lines.slice(1).map((line) => {
    const values = line.split(',')
    const properties = {}
    header.forEach((key, i) => {
      properties[key] = values[i]
    })
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number(values[lonIdx]), Number(values[latIdx])],
      },
      properties,
    }
  })

  return { type: 'FeatureCollection', features }
}

// ok:false = transient failure (not cached, retried next run) — distinct from
// ok:true, location:null which means geo.api.gouv.fr genuinely found no
// commune (point outside France), a result worth caching permanently.
async function lookupCommune(feature) {
  const [lon, lat] = feature.geometry.coordinates
  const url = `${COMMUNE_LOOKUP_URL}?lat=${lat}&lon=${lon}&fields=nom,code,departement,region`

  try {
    const response = await fetch(url)
    if (!response.ok) return { ok: false }
    const [match] = await response.json()
    if (!match) return { ok: true, location: null }

    return {
      ok: true,
      location: {
        commune: match.nom || null,
        code_insee: match.code || null,
        departement: match.departement?.nom || null,
        region: match.region?.nom || null,
      },
    }
  } catch {
    return { ok: false }
  }
}

async function enrichWithLocation(features) {
  // Without this cache, refetching a 5-day window every 3h would re-geocode
  // almost every point on every run — consecutive runs' windows overlap by
  // ~5/6, so only genuinely new points need a fresh lookup.
  const cache = await loadCommuneCache()
  const enriched = []
  let dropped = 0
  let fromCache = 0
  let queried = 0

  for (let i = 0; i < features.length; i += COMMUNE_LOOKUP_CONCURRENCY) {
    const batch = features.slice(i, i + COMMUNE_LOOKUP_CONCURRENCY)
    const locations = await Promise.all(
      batch.map(async (feature) => {
        const key = coordKey(feature)
        if (Object.prototype.hasOwnProperty.call(cache, key)) {
          cache[key].lastSeen = Date.now()
          fromCache += 1
          return cache[key].location
        }
        const result = await lookupCommune(feature)
        queried += 1
        if (result.ok) cache[key] = { location: result.location, lastSeen: Date.now() }
        return result.ok ? result.location : null
      })
    )
    // Flush after each concurrent batch so a run over thousands of points
    // doesn't lose everything if interrupted.
    await writeFile(communeCacheFile, JSON.stringify(cache))

    batch.forEach((feature, j) => {
      const location = locations[j]
      if (!location) {
        dropped += 1
        return
      }
      feature.properties = { ...feature.properties, ...location }
      enriched.push(feature)
    })
  }

  await writeFile(communeCacheFile, JSON.stringify(cache))
  console.log(
    `  (${fromCache} point(s) from cache, ${queried} newly queried against geo.api.gouv.fr)`
  )
  if (dropped > 0) {
    console.log(`  (dropped ${dropped} point(s) outside France / unresolvable)`)
  }

  return enriched
}

const ARCHIVE_DATETIME_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

// Small standalone duplicate of src/config.ts's acqDateTimeToUtcDate/
// parisDateString — this script is a plain .mjs run directly with `node`,
// not through the TS/Vite pipeline, so it can't import from src/.
function parisDateOf(acqDate, acqTime) {
  if (!acqDate || !acqTime) return null
  const padded = acqTime.padStart(4, '0')
  const utcDate = new Date(`${acqDate}T${padded.slice(0, 2)}:${padded.slice(2)}:00Z`)
  if (Number.isNaN(utcDate.getTime())) return null
  const parts = Object.fromEntries(
    ARCHIVE_DATETIME_FORMAT.formatToParts(utcDate).map((p) => [p.type, p.value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

// FIRMS has no stable per-detection id, and the same detection reappears in
// every run until it ages out of the 5-day window — dedup on what actually
// identifies a distinct detection.
function archiveDedupKey(feature) {
  const [lon, lat] = feature.geometry.coordinates
  const p = feature.properties
  return `${p.satellite}|${p.acq_date}|${p.acq_time}|${lon.toFixed(4)},${lat.toFixed(4)}`
}

async function updateArchive(features) {
  const byDate = new Map() // 'YYYY-MM-DD' -> features
  for (const feature of features) {
    const date = parisDateOf(feature.properties.acq_date, feature.properties.acq_time)
    if (!date) continue
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date).push(feature)
  }

  await mkdir(archiveDir, { recursive: true })

  let daysTouched = 0
  let pointsAdded = 0
  for (const [date, dateFeatures] of byDate) {
    const file = path.join(archiveDir, `${date}.geojson`)
    let existing = []
    try {
      existing = JSON.parse(await readFile(file, 'utf-8')).features
    } catch {
      // No archive yet for this day.
    }

    const byKey = new Map(existing.map((f) => [archiveDedupKey(f), f]))
    const before = byKey.size
    for (const feature of dateFeatures) {
      byKey.set(archiveDedupKey(feature), feature)
    }
    if (byKey.size === before) continue // nothing new for this day

    daysTouched += 1
    pointsAdded += byKey.size - before
    await writeFile(
      file,
      JSON.stringify({ type: 'FeatureCollection', features: [...byKey.values()] })
    )
  }

  let purged = 0
  const cutoff = Date.now() - ARCHIVE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  for (const name of await readdir(archiveDir).catch(() => [])) {
    const match = name.match(/^(\d{4}-\d{2}-\d{2})\.geojson$/)
    if (!match) continue
    if (new Date(`${match[1]}T00:00:00Z`).getTime() < cutoff) {
      await unlink(path.join(archiveDir, name))
      purged += 1
    }
  }

  console.log(`  (archive: ${pointsAdded} point(s) added across ${daysTouched} day(s))`)
  if (purged > 0) {
    console.log(`  (archive: purged ${purged} day(s) older than ${ARCHIVE_MAX_AGE_DAYS} days)`)
  }

  await writeArchiveIndex()
}

// A manifest of {date, count} for every archived day still on disk, so the
// frontend can extend the time slider's range/histogram with one small
// fetch instead of pulling every archived day's full GeoJSON upfront.
async function writeArchiveIndex() {
  const names = (await readdir(archiveDir).catch(() => []))
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.geojson$/.test(name))
    .sort()

  const dates = []
  for (const name of names) {
    const date = name.replace('.geojson', '')
    const { features } = JSON.parse(await readFile(path.join(archiveDir, name), 'utf-8'))
    dates.push({ date, count: features.length })
  }

  await writeFile(path.join(archiveDir, 'index.json'), JSON.stringify({ dates }))
}

async function fetchCommuneBoundary(code) {
  const url = `${COMMUNE_LOOKUP_URL}/${code}?fields=nom,code,departement,region&format=geojson&geometry=contour`
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function fetchCommunesContext(features) {
  const hotspotCounts = new Map()
  for (const feature of features) {
    const code = feature.properties.code_insee
    hotspotCounts.set(code, (hotspotCounts.get(code) || 0) + 1)
  }
  const codes = [...hotspotCounts.keys()]

  const boundaries = []
  for (let i = 0; i < codes.length; i += COMMUNE_LOOKUP_CONCURRENCY) {
    const batch = codes.slice(i, i + COMMUNE_LOOKUP_CONCURRENCY)
    const results = await Promise.all(batch.map(fetchCommuneBoundary))
    results.forEach((commune, j) => {
      if (!commune) return
      commune.properties.hotspot_count = hotspotCounts.get(batch[j])
      boundaries.push(commune)
    })
  }

  return { type: 'FeatureCollection', features: boundaries }
}

// `date` is FIRMS's optional trailing path segment: DAY_RANGE days ending on
// that date instead of ending today. Used by backfillArchive() below to pull
// chunks further back than the regular 3h cron run has accumulated.
async function fetchSource(mapKey, source, date, attempt = 1) {
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${source}/${AREA}/${DAY_RANGE}${date ? `/${date}` : ''}`
  let response
  let body
  try {
    response = await fetch(url)
    body = await response.text()
  } catch (err) {
    if (attempt < 3) {
      await sleep(5000)
      return fetchSource(mapKey, source, date, attempt + 1)
    }
    throw err
  }

  if (!response.ok || body.startsWith('Invalid') || body.startsWith('Error')) {
    console.error(`FIRMS API error (${source}): ${body}`)
    process.exit(1)
  }

  if (body.trim() === '' || body.split('\n').length <= 1) return []
  return csvToGeoJSON(body).features
}

// One-off historical backfill: walk backwards in DAY_RANGE-sized chunks,
// beyond the window the regular cron run already covers, merging each chunk
// into the local archive only (not the live firms-france-*/communes-context
// outputs, which represent the current 5-day window only). How far back this
// can actually reach depends on how much NRT retention FIRMS still has for
// the requested dates — expect it to thin out well before ARCHIVE_MAX_AGE_DAYS.
async function backfillArchive(mapKey, days) {
  console.log(`Backfilling up to ${days} extra day(s) of archive history...`)
  const today = new Date()

  for (let offset = DAY_RANGE; offset < DAY_RANGE + days; offset += DAY_RANGE) {
    const endDate = new Date(today)
    endDate.setUTCDate(endDate.getUTCDate() - offset)
    const dateStr = endDate.toISOString().slice(0, 10)

    console.log(`  chunk ending ${dateStr}...`)
    const featuresPerSource = await Promise.all(
      SOURCES.map((source) => fetchSource(mapKey, source, dateStr))
    )
    featuresPerSource.forEach((features, i) => {
      console.log(`    ${SOURCES[i]}: ${features.length} raw hotspot(s)`)
    })

    let features = featuresPerSource.flat()
    if (features.length === 0) continue

    features = await enrichWithLocation(features)
    await updateArchive(features)
  }

  console.log('✓ Backfill complete.')
}

async function main() {
  const mapKey = process.env.FIRMS_MAP_KEY
  if (!mapKey) {
    console.error('Missing FIRMS_MAP_KEY environment variable.')
    console.error('Get a free key at https://firms.modaps.eosdis.nasa.gov/api/map_key/')
    process.exit(1)
  }

  const backfillDays = Number(process.env.FIRMS_BACKFILL_DAYS || 0)
  if (backfillDays > 0) {
    await backfillArchive(mapKey, backfillDays)
    return
  }

  const featuresPerSource = await Promise.all(SOURCES.map((source) => fetchSource(mapKey, source)))
  featuresPerSource.forEach((features, i) => {
    console.log(`  ${SOURCES[i]}: ${features.length} raw hotspot(s)`)
  })

  let allFeatures = featuresPerSource.flat()

  if (allFeatures.length > 0) {
    console.log(`Reverse-geocoding ${allFeatures.length} point(s)...`)
    allFeatures = await enrichWithLocation(allFeatures)
  }

  console.log("Updating local archive (beyond FIRMS' 5-day window)...")
  await updateArchive(allFeatures)

  for (const bucket of FRP_BUCKETS) {
    const min = FRP_BUCKETS[FRP_BUCKETS.indexOf(bucket) - 1]?.max ?? 0
    const features = allFeatures.filter((f) => {
      const frp = Number(f.properties.frp)
      return frp >= min && frp < bucket.max
    })
    const outputFile = path.join(dataDir, `firms-france-${bucket.id}.geojson`)
    await writeFile(outputFile, JSON.stringify({ type: 'FeatureCollection', features }))
    console.log(
      `✓ Wrote ${features.length} hotspot(s) to ${path.relative(process.cwd(), outputFile)}`
    )
  }

  const communesContext =
    allFeatures.length > 0
      ? await fetchCommunesContext(allFeatures)
      : { type: 'FeatureCollection', features: [] }
  await writeFile(communesOutputFile, JSON.stringify(communesContext))
  console.log(
    `✓ Wrote ${communesContext.features.length} commune boundary(ies) to ${path.relative(process.cwd(), communesOutputFile)}`
  )
}

main()
