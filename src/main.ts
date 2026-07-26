import 'leaflet/dist/leaflet.css'
import 'leaflet-atlas/css'
import './css/app.css'

import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapApp } from 'leaflet-atlas'
import { config, frpScale, acqDateTimeToUtcDate, parisDateString } from './config'

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

const TIME_SLIDER_DAYS_BACK = 5
const SLIDER_LAYER_IDS = frpScale.map((bucket) => `firms_${bucket.id}`)

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

  const applyFilter = (daysAgo: number) => {
    const targetDate = parisDateString(dateForDaysAgo(daysAgo))
    for (const entry of entries) {
      const shouldShow = entry.dateStr === targetDate
      const isShown = entry.group.hasLayer(entry.marker)
      if (shouldShow && !isShown) entry.group.addLayer(entry.marker)
      else if (!shouldShow && isShown) entry.group.removeLayer(entry.marker)
    }
  }

  // Per-day detection counts for the mini histogram, indexed the same way as
  // the slider itself (0 = oldest day, TIME_SLIDER_DAYS_BACK = today).
  // Computed once here (one O(n) pass over `entries`), never recomputed
  // inside update()/render loops.
  const countsByDate = new Map<string, number>()
  for (const entry of entries) {
    if (!entry.dateStr) continue
    countsByDate.set(entry.dateStr, (countsByDate.get(entry.dateStr) ?? 0) + 1)
  }
  const dayCounts: number[] = []
  for (let i = 0; i <= TIME_SLIDER_DAYS_BACK; i++) {
    const daysAgo = TIME_SLIDER_DAYS_BACK - i
    dayCounts.push(countsByDate.get(parisDateString(dateForDaysAgo(daysAgo))) ?? 0)
  }
  const maxDayCount = Math.max(1, ...dayCounts)

  const control = new L.Control({ position: 'bottomright' })
  control.onAdd = () => {
    const div = L.DomUtil.create('div', 'time-slider-control')
    div.innerHTML = `
      <strong>Évolution (${TIME_SLIDER_DAYS_BACK + 1} jours)</strong>
      <div class="time-slider-row">
        <button type="button" class="time-slider-step time-slider-play" aria-label="Lecture automatique" aria-pressed="false">▶︎</button>
        <div class="time-slider-track-wrap">
          <div class="time-slider-histogram" aria-hidden="true"></div>
          <input type="range" min="0" max="${TIME_SLIDER_DAYS_BACK}" step="1" value="${TIME_SLIDER_DAYS_BACK}" class="time-slider-input" aria-label="Jour affiché">
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

    const input = div.querySelector('.time-slider-input') as HTMLInputElement
    const label = div.querySelector('.time-slider-label') as HTMLElement
    const srLive = div.querySelector('.time-slider-sr-live') as HTMLElement
    const playBtn = div.querySelector('.time-slider-play') as HTMLButtonElement
    const histogramEl = div.querySelector('.time-slider-histogram') as HTMLElement
    const ticksEl = div.querySelector('.time-slider-ticks') as HTMLElement
    const stepButtons = div.querySelectorAll<HTMLButtonElement>('.time-slider-step[data-dir]')

    const ticks: HTMLElement[] = []
    const bars: HTMLElement[] = []
    for (let i = 0; i <= TIME_SLIDER_DAYS_BACK; i++) {
      const daysAgo = TIME_SLIDER_DAYS_BACK - i
      const tick = L.DomUtil.create('span', 'time-slider-tick', ticksEl)
      tick.textContent = tickLabel(daysAgo)
      ticks.push(tick)

      const bar = L.DomUtil.create('span', 'time-slider-bar', histogramEl)
      bar.style.height = `${Math.round((dayCounts[i] / maxDayCount) * 100)}%`
      bars.push(bar)
    }

    // The slider's own value runs left (0, oldest day) to right (max, today) —
    // matching how a timeline normally reads, past on the left. `daysAgo` (used
    // by applyFilter/dayLabel) is the inverse of that, so it's derived here.
    const update = () => {
      const sliderValue = Number(input.value)
      const daysAgo = TIME_SLIDER_DAYS_BACK - sliderValue
      const currentLabel = dayLabel(daysAgo)
      label.textContent = currentLabel
      srLive.textContent = `Affichage du ${currentLabel}`
      applyFilter(daysAgo)
      stepButtons.forEach((btn) => {
        const dir = Number(btn.dataset.dir)
        const next = sliderValue + dir
        btn.disabled = next < 0 || next > TIME_SLIDER_DAYS_BACK
      })
      ticks.forEach((tick, i) => tick.classList.toggle('is-active', i === sliderValue))
      bars.forEach((bar, i) => bar.classList.toggle('is-active', i === sliderValue))
    }

    // Autoplay steps through the days on an interval, reusing update()/
    // applyFilter() directly rather than duplicating the filtering logic.
    // It advances `input.value` without dispatching an `input` event, so it
    // never re-triggers its own stopPlay() call below.
    let playTimer: ReturnType<typeof setInterval> | null = null
    const stopPlay = () => {
      if (playTimer === null) return
      clearInterval(playTimer)
      playTimer = null
      playBtn.textContent = '▶︎'
      playBtn.setAttribute('aria-label', 'Lecture automatique')
      playBtn.setAttribute('aria-pressed', 'false')
    }
    const startPlay = () => {
      if (playTimer !== null) return
      // Already at the last day (today) — replaying forward from here would
      // have nowhere to go, so restart the timelapse from the oldest day.
      if (Number(input.value) >= TIME_SLIDER_DAYS_BACK) {
        input.value = '0'
        update()
      }
      playBtn.textContent = '⏸'
      playBtn.setAttribute('aria-label', 'Mettre en pause')
      playBtn.setAttribute('aria-pressed', 'true')
      playTimer = setInterval(() => {
        const next = Number(input.value) + 1
        if (next > TIME_SLIDER_DAYS_BACK) {
          stopPlay()
          return
        }
        input.value = String(next)
        update()
      }, 1200)
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

    return div
  }
  control.addTo(app.getMap())
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
