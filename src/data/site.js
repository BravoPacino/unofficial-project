import map from './penangMap'

export const SITE = map.site

export function dms(v, pos, neg) {
  const a = Math.abs(v)
  let d = Math.floor(a), m = Math.floor((a - d) * 60), s = Math.round(((a - d) * 60 - m) * 60)
  if (s === 60) { s = 0; m += 1 }
  if (m === 60) { m = 0; d += 1 }
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″${v >= 0 ? pos : neg}`
}

export const COORD = `${dms(SITE.lat, 'N', 'S')} · ${dms(SITE.lon, 'E', 'W')}`
