import 'leaflet/dist/leaflet.css'
import 'leaflet-atlas/css'
import './css/app.css'

import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapApp } from 'leaflet-atlas'
import { config, frpScale, frpBucketId, acqDateTimeToUtcDate, parisDateString } from './config'

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

// leaflet-atlas only renders config.title in the on-page overlay, not the
// browser tab — set document.title separately so both stay in sync.
if (config.title?.heading) {
  document.title = config.title.heading
}

// Fixed size of the live rolling window (see scripts/fetch-firms.mjs's
// DAY_RANGE, FIRMS' own API cap) — days older than this come from the
// archive instead, fetched lazily (see extendSliderWithArchive below).
const LIVE_DAYS_BACK = 5
const SLIDER_LAYER_IDS = frpScale.map((bucket) => `firms_${bucket.id}`)

// Builds an on-demand Leaflet layer for one archived day's GeoJSON, styled
// and interactive the same way leaflet-atlas renders the live FRP layers
// (see node_modules/leaflet-atlas/src/js/map-app.js's _processLayer /
// _bindFeatureEvents) — reimplemented here because archive files hold all
// FRP buckets unsplit, unlike the live pipeline's per-bucket files.
function buildArchiveLayer(app: any, geojson: any) {
  const detailBuilders = config.detailBuilders()
  return L.geoJSON(geojson, {
    pointToLayer: (feature: any, latlng: L.LatLng) => {
      const bucketId = frpBucketId(Number(feature.properties.frp))
      return L.circleMarker(latlng, (config.styles as any)[`firms_${bucketId}`])
    },
    onEachFeature: (feature, layer: any) => {
      const bucketId = frpBucketId(Number(feature.properties.frp))
      const tooltipFn = (config.tooltips as any)[`firms_${bucketId}`]
      if (tooltipFn) {
        layer.bindTooltip(tooltipFn(feature.properties), {
          className: 'feature-tooltip',
          sticky: true,
          direction: 'top',
          offset: [0, -10],
        })
      }
      layer.on('click', () => {
        const builder = detailBuilders[`firms_${bucketId}`]
        if (builder) app.showDetail(builder(feature.properties))
      })
    },
  })
}

// Filters the FRP hotspot layers down to one Paris-local calendar day at a
// time (the fetch pipeline now pulls a 5-day FIRMS window — see
// scripts/fetch-firms.mjs — instead of just the latest 24h).
//
// leaflet-atlas has no per-feature filter/reload API, so this reaches into
// each layer def's `_leafletLayer` (the underlying L.geoJSON FeatureGroup,
// reachable via the public `getAllLayerDefs()`) and toggles individual
// markers with `addLayer`/`removeLayer` — this (rather than calling
// `marker.addTo(map)`/`.remove()` directly) keeps it consistent with the
// layers-drawer checkbox, which shows/hides the whole FeatureGroup: a
// removed marker just stays unregistered from the group until re-added,
// instead of fighting over whether it's on the map.
function setupTimeSlider(app: any) {
  const map = app.getMap()
  let daysBack = LIVE_DAYS_BACK

  const entries: { group: any; marker: any; dateStr: string | null }[] = []
  for (const def of app.getAllLayerDefs()) {
    if (!SLIDER_LAYER_IDS.includes(def.id) || !def._leafletLayer) continue
    def._leafletLayer.eachLayer((marker: any) => {
      const utcDate = acqDateTimeToUtcDate(marker.feature.properties.acq_date, marker.feature.properties.acq_time)
      entries.push({ group: def._leafletLayer, marker, dateStr: utcDate ? parisDateString(utcDate) : null })
    })
  }

  const now = new Date()
  const dateForDaysAgo = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  const dayLabel = (daysAgo: number) =>
    dateForDaysAgo(daysAgo).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })

  // Short form for the per-day tick marks: the full dayLabel (with weekday)
  // is too wide for a ~30px tick column and wraps onto two lines, pushing
  // the tick row up into the slider track. The full label is still shown
  // in .time-slider-label below the track.
  const tickLabel = (daysAgo: number) =>
    dateForDaysAgo(daysAgo).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    })

  // Archived days (older than LIVE_DAYS_BACK) are fetched lazily, one day at
  // a time, only once the user actually scrubs/steps/plays into them — never
  // upfront. Each date's fetch is cached (Promise, so concurrent requests for
  // the same date collapse into one) so revisiting a day already viewed this
  // session costs nothing.
  const archiveLayerCache = new Map<string, Promise<L.Layer | null>>()
  let currentArchiveLayer: L.Layer | null = null
  let archiveRequestId = 0
  let pendingArchiveLoad: Promise<unknown> | null = null
  let notifyStatus: (text: string) => void = () => {}

  const loadArchiveDay = (date: string) => {
    let promise = archiveLayerCache.get(date)
    if (promise) return promise
    promise = fetch(config.archive.dayFile(date))
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((geojson) => buildArchiveLayer(app, geojson))
      .catch(() => null)
    archiveLayerCache.set(date, promise)
    return promise
  }

  const showArchiveDay = (daysAgo: number) => {
    const date = parisDateString(dateForDaysAgo(daysAgo))
    const requestId = ++archiveRequestId
    if (currentArchiveLayer) {
      map.removeLayer(currentArchiveLayer)
      currentArchiveLayer = null
    }
    notifyStatus(`Chargement du ${dayLabel(daysAgo)}…`)
    const load = loadArchiveDay(date).then((layer) => {
      if (requestId !== archiveRequestId) return // superseded by a newer scrub/step
      if (layer) {
        layer.addTo(map)
        currentArchiveLayer = layer
        notifyStatus(`Affichage du ${dayLabel(daysAgo)}`)
      } else {
        notifyStatus(`Données indisponibles pour le ${dayLabel(daysAgo)}`)
      }
    })
    pendingArchiveLoad = load
    return load
  }

  const applyFilter = (daysAgo: number) => {
    if (daysAgo <= LIVE_DAYS_BACK) {
      archiveRequestId++ // invalidate any in-flight archive load
      pendingArchiveLoad = null
      if (currentArchiveLayer) {
        map.removeLayer(currentArchiveLayer)
        currentArchiveLayer = null
      }
      const targetDate = parisDateString(dateForDaysAgo(daysAgo))
      for (const entry of entries) {
        const shouldShow = entry.dateStr === targetDate
        const isShown = entry.group.hasLayer(entry.marker)
        if (shouldShow && !isShown) entry.group.addLayer(entry.marker)
        else if (!shouldShow && isShown) entry.group.removeLayer(entry.marker)
      }
      return
    }

    for (const entry of entries) {
      if (entry.group.hasLayer(entry.marker)) entry.group.removeLayer(entry.marker)
    }
    showArchiveDay(daysAgo)
  }

  // Per-day detection counts for the mini histogram, indexed the same way as
  // the slider itself (0 = oldest day, daysBack = today). Computed once here
  // (one O(n) pass over `entries`) for the live window; extendSliderWithArchive
  // merges in archive-day counts (from a manifest, not full geometry) later.
  const countsByDate = new Map<string, number>()
  for (const entry of entries) {
    if (!entry.dateStr) continue
    countsByDate.set(entry.dateStr, (countsByDate.get(entry.dateStr) ?? 0) + 1)
  }

  const control = new L.Control({ position: 'bottomright' })
  control.onAdd = () => {
    const div = L.DomUtil.create('div', 'time-slider-control')
    div.innerHTML = `
      <strong class="time-slider-heading">Évolution (${daysBack + 1} jours)</strong>
      <div class="time-slider-row">
        <button type="button" class="time-slider-step time-slider-play" aria-label="Lecture automatique" aria-pressed="false">▶︎</button>
        <div class="time-slider-track-wrap">
          <div class="time-slider-histogram" aria-hidden="true"></div>
          <input type="range" min="0" max="${daysBack}" step="1" value="${daysBack}" class="time-slider-input" aria-label="Jour affiché">
          <div class="time-slider-ticks" aria-hidden="true"></div>
        </div>
      </div>
      <div class="time-slider-controls-row">
        <button type="button" class="time-slider-step" data-dir="-1" aria-label="Jour précédent">◀</button>
        <div class="time-slider-label"></div>
        <button type="button" class="time-slider-step" data-dir="1" aria-label="Jour suivant">▶</button>
      </div>
      <div class="time-slider-sr-live" aria-live="polite" role="status"></div>
    `
    L.DomEvent.disableClickPropagation(div)
    L.DomEvent.disableScrollPropagation(div)

    const heading = div.querySelector('.time-slider-heading') as HTMLElement
    const input = div.querySelector('.time-slider-input') as HTMLInputElement
    const label = div.querySelector('.time-slider-label') as HTMLElement
    const srLive = div.querySelector('.time-slider-sr-live') as HTMLElement
    const playBtn = div.querySelector('.time-slider-play') as HTMLButtonElement
    const histogramEl = div.querySelector('.time-slider-histogram') as HTMLElement
    const ticksEl = div.querySelector('.time-slider-ticks') as HTMLElement
    const stepButtons = div.querySelectorAll<HTMLButtonElement>('.time-slider-step[data-dir]')
    notifyStatus = (text) => {
      srLive.textContent = text
    }

    const ticks: HTMLElement[] = []
    const bars: HTMLElement[] = []
    const renderTicksAndHistogram = () => {
      ticksEl.innerHTML = ''
      histogramEl.innerHTML = ''
      ticks.length = 0
      bars.length = 0
      const dayCounts: number[] = []
      for (let i = 0; i <= daysBack; i++) {
        const daysAgo = daysBack - i
        dayCounts.push(countsByDate.get(parisDateString(dateForDaysAgo(daysAgo))) ?? 0)
      }
      const maxDayCount = Math.max(1, ...dayCounts)
      // Once the archive pushes daysBack well past a week, labeling every
      // tick crowds them into unreadable overlap. The control's track is a
      // fixed ~180px regardless of range, so thin to a roughly constant
      // *count* of labels (not a constant day-interval) — otherwise a fixed
      // interval like "every 5 days" still overlaps once daysBack outgrows
      // it. Anchored on "today" (daysAgo % N) so a given calendar day's tick
      // keeps or loses its label consistently day over day rather than
      // jittering. Today and the oldest visible day are always labeled so
      // the range's two ends stay identifiable; bars stay one-per-day
      // regardless, only the text labels get sparser.
      const TARGET_LABEL_COUNT = 5
      const tickInterval = daysBack <= 10 ? 1 : Math.max(7, Math.ceil(daysBack / TARGET_LABEL_COUNT))
      for (let i = 0; i <= daysBack; i++) {
        const daysAgo = daysBack - i
        const tick = L.DomUtil.create('span', 'time-slider-tick', ticksEl)
        if (daysAgo === 0 || i === 0 || daysAgo % tickInterval === 0) {
          tick.textContent = tickLabel(daysAgo)
        }
        ticks.push(tick)

        const bar = L.DomUtil.create('span', 'time-slider-bar', histogramEl)
        bar.style.height = `${Math.round((dayCounts[i] / maxDayCount) * 100)}%`
        bars.push(bar)
      }
    }
    renderTicksAndHistogram()

    // The slider's own value runs left (0, oldest day) to right (max, today) —
    // matching how a timeline normally reads, past on the left. `daysAgo` (used
    // by applyFilter/dayLabel) is the inverse of that, so it's derived here.
    const update = () => {
      const sliderValue = Number(input.value)
      const daysAgo = daysBack - sliderValue
      const currentLabel = dayLabel(daysAgo)
      label.textContent = currentLabel
      srLive.textContent = `Affichage du ${currentLabel}`
      applyFilter(daysAgo)
      stepButtons.forEach((btn) => {
        const dir = Number(btn.dataset.dir)
        const next = sliderValue + dir
        btn.disabled = next < 0 || next > daysBack
      })
      ticks.forEach((tick, i) => tick.classList.toggle('is-active', i === sliderValue))
      bars.forEach((bar, i) => bar.classList.toggle('is-active', i === sliderValue))
    }

    // Autoplay steps through the days on a self-scheduling timeout (rather
    // than a fixed setInterval) so that, once scrubbed past LIVE_DAYS_BACK,
    // it waits for each archive day's fetch to settle before advancing —
    // otherwise fast autoplay through many uncached archive days would fire
    // a new fetch every 1.2s regardless of whether the previous one resolved.
    let playTimer: ReturnType<typeof setTimeout> | null = null
    const stopPlay = () => {
      if (playTimer === null) return
      clearTimeout(playTimer)
      playTimer = null
      playBtn.textContent = '▶︎'
      playBtn.setAttribute('aria-label', 'Lecture automatique')
      playBtn.setAttribute('aria-pressed', 'false')
    }
    const scheduleNextPlayTick = () => {
      playTimer = setTimeout(async () => {
        if (pendingArchiveLoad) await pendingArchiveLoad.catch(() => {})
        const next = Number(input.value) + 1
        if (next > daysBack) {
          stopPlay()
          return
        }
        input.value = String(next)
        update()
        if (playTimer !== null) scheduleNextPlayTick()
      }, 1200)
    }
    const startPlay = () => {
      if (playTimer !== null) return
      // Already at the last day (today) — replaying forward from here would
      // have nowhere to go, so restart the timelapse from the oldest day.
      if (Number(input.value) >= daysBack) {
        input.value = '0'
        update()
      }
      playBtn.textContent = '⏸'
      playBtn.setAttribute('aria-label', 'Mettre en pause')
      playBtn.setAttribute('aria-pressed', 'true')
      scheduleNextPlayTick()
    }
    playBtn.addEventListener('click', () => (playTimer === null ? startPlay() : stopPlay()))

    input.addEventListener('input', () => {
      stopPlay()
      update()
    })
    stepButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        stopPlay()
        const dir = Number(btn.dataset.dir)
        input.value = String(Number(input.value) + dir)
        update()
      })
    })
    update()

    // Runs after the slider above is already built and interactive — never
    // blocks first paint. Fetches only the tiny archive manifest (counts,
    // no geometry) and extends the slider's range/histogram to cover it;
    // actual per-day geometry is still fetched lazily by showArchiveDay()
    // above, only once the user scrubs into that day.
    ;(async () => {
      let manifest: { dates?: { date: string; count: number }[] }
      try {
        const res = await fetch(config.archive.indexFile)
        if (!res.ok) return
        manifest = await res.json()
      } catch {
        return // archive manifest unavailable — 5-day slider keeps working as-is
      }

      const dates = manifest.dates ?? []
      if (dates.length === 0) return

      for (const { date, count } of dates) {
        if (!countsByDate.has(date)) countsByDate.set(date, count)
      }

      // dates is sorted ascending (oldest first) by scripts/fetch-firms.mjs.
      // If the archive's oldest day is already within the live window (e.g.
      // right after this feature ships, before the archive has accumulated
      // past 5 days), there's nothing older to extend into — the search
      // below only looks further into the past, so it would spin to its cap
      // without ever matching a date that's actually more recent than today.
      const currentOldestDate = parisDateString(dateForDaysAgo(daysBack))
      if (dates[0].date >= currentOldestDate) return

      // Find how many daysAgo that oldest date is by walking dateForDaysAgo/
      // parisDateString — the same Paris-local calendar-day bucketing used
      // everywhere else in this file — rather than a raw millisecond
      // subtraction, which is off by up to a day against Paris-local dates
      // (UTC midnight vs. Europe/Paris midnight, DST).
      const oldestArchiveDate = dates[0].date
      let newDaysBack = daysBack
      while (parisDateString(dateForDaysAgo(newDaysBack)) !== oldestArchiveDate && newDaysBack < daysBack + 200) {
        newDaysBack++
      }
      if (newDaysBack === daysBack) return

      const addedDays = newDaysBack - daysBack
      const prevValue = Number(input.value)
      daysBack = newDaysBack

      input.max = String(daysBack)
      input.value = String(prevValue + addedDays)
      heading.textContent = `Évolution (${daysBack + 1} jours)`
      renderTicksAndHistogram()
      update()
    })()

    return div
  }
  control.addTo(map)
}

// Initialize the atlas
const app = new MapApp({ ...config, onReady: setupTimeSlider })

// FRP color-scale legend (leaflet-atlas styles are static per-layer, so
// the "color scale" is implemented as one layer per bucket — see config.ts —
// and this control just documents what each color means).
const legend = new L.Control({ position: 'bottomleft' })
legend.onAdd = () => {
  const div = L.DomUtil.create('div', 'frp-legend')
  div.innerHTML = `
    <strong>Puissance radiative (FRP)</strong>
    ${frpScale
      .map(
        (bucket) => `
          <div class="frp-legend-row">
            <span class="frp-legend-swatch" style="background:${bucket.color};border-color:${bucket.stroke}"></span>
            ${bucket.label}
          </div>
        `
      )
      .join('')}
  `
  return div
}
legend.addTo(app.getMap())

// Export for debugging in browser console
;(window as any).app = app
