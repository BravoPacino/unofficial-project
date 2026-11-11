// Where the light in the ink drawings comes from.
// The time of day is real: the sun over George Town at that minute (lib/sun.js) sets how long the shadows are
// and which side they fall. Which way each façade actually faces is not known, so the light is always kept in
// front of the drawing, the way an elevation is conventionally shaded — morning from the left, afternoon from the right.
import { sunPosition } from '../lib/sun'
import { SITE } from '../data/site'

const RAD = Math.PI / 180, MIN = 60000
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const alt = (t) => sunPosition(new Date(t), SITE.lat, SITE.lon).alt

/** Sunrise, solar noon and sunset (ms) of the George Town day that contains t */
export function dayOf(t) {
  const start = Math.floor((t + 8 * 3600000) / 86400000) * 86400000 - 8 * 3600000       // local midnight, UTC+8
  let rise = null, set = null, prev = alt(start)
  for (let m = 2; m <= 1440; m += 2) {
    const a = alt(start + m * MIN)
    if (prev <= 0 && a > 0) rise = start + (m - 2 * a / (a - prev)) * MIN
    if (prev > 0 && a <= 0) set = start + (m - 2 * a / (a - prev)) * MIN
    prev = a
  }
  return { rise, set, noon: (rise + set) / 2 }
}

// Drawn height of the sun: never below LOW, and held at HIGH above that — a midday sun would put every recess in full shade
const LOW = 14, HIGH = 52, SIDE = 40 * RAD

export function lightAt(t, day = dayOf(t)) {
  const pos = sunPosition(new Date(t), SITE.lat, SITE.lon)
  const up = pos.alt > 0
  // with the sun down the drawing keeps first light (before sunrise) or last light (after sunset) rather than going black
  const a = clamp(up ? pos.alt : LOW, LOW, HIGH) * RAD
  const side = up ? clamp((t - day.noon) / (75 * MIN), -1, 1) : (t > day.noon ? 1 : -1)
  const h = Math.sin(SIDE) * side
  const v = [h * Math.cos(a), Math.sin(a), Math.sqrt(1 - h * h) * Math.cos(a)]
  const n = Math.hypot(...v)
  return { ...pos, up, dir: v.map((c) => c / n), frac: clamp((t - day.rise) / (day.set - day.rise), 0, 1) }
}

export const clockOf = (t) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' }).format(new Date(t))

/**
 * The sun in the one take's world, which has a north (site.js: x east, y up, z south): its real bearing over George
 * Town at t, its height held between LOW and HIGH as in every drawing. With the sun down, the world keeps the day's
 * first light (before sunrise) or last light (after sunset), from where the sun rose or set.
 * Returns { dir: unit vector towards the sun, up, alt (drawn), az (real, degrees from north, clockwise) }.
 */
export function sunWorld(t, day = dayOf(t)) {
  const now = sunPosition(new Date(t), SITE.lat, SITE.lon), up = now.alt > 0
  const az = up ? now.az : sunPosition(new Date(t < day.noon ? day.rise + 20 * MIN : day.set - 20 * MIN), SITE.lat, SITE.lon).az
  const a = clamp(up ? now.alt : LOW, LOW, HIGH) * RAD, b = az * RAD
  return { dir: [Math.sin(b) * Math.cos(a), Math.sin(a), -Math.cos(b) * Math.cos(a)], up, alt: a / RAD, az }
}
