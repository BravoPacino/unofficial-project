// One camera path through world keys { eye, at, fov, shift?, keep?, dt }: dt is the scroll (in screens) from the key
// before. Centripetal Catmull–Rom through the eyes and the points looked at (no loops or overshoot where keys are unevenly
// spaced), and the distance flown against scroll laid on a monotone cubic, so the speed changes smoothly, never in a jump.
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const smooth = (t) => t * t * (3 - 2 * t)

function crc(P, j, u) {
  const p = [P[Math.max(0, j - 1)], P[j], P[j + 1], P[Math.min(P.length - 1, j + 2)]]
  const d = (a, b) => Math.max(1e-3, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])))
  const t0 = 0, t1 = t0 + d(p[0], p[1]), t2 = t1 + d(p[1], p[2]), t3 = t2 + d(p[2], p[3]), t = t1 + (t2 - t1) * u
  const mix = (a, b, ta, tb) => a.map((v, k) => ((tb - t) * v + (t - ta) * b[k]) / (tb - ta))
  const A1 = mix(p[0], p[1], t0, t1), A2 = mix(p[1], p[2], t1, t2), A3 = mix(p[2], p[3], t2, t3)
  return mix(mix(A1, A2, t0, t2), mix(A2, A3, t1, t3), t1, t2)
}

export function makePath(KEYS) {
  const EYES = KEYS.map((k) => k.eye), ATS = KEYS.map((k) => k.at)
  const TIME = KEYS.reduce((a, k, i) => { a.push(i ? a[i - 1] + (k.dt ?? 1) : 0); return a }, [])
  const TABLES = KEYS.slice(1).map((_, j) => {
    const out = [0]; let prev = crc(EYES, j, 0)
    for (let i = 1; i <= 24; i++) { const q = crc(EYES, j, i / 24); out.push(out.at(-1) + Math.max(0.05, Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]))); prev = q }
    return out
  })
  const LEN = TABLES.reduce((a, t) => { a.push(a.at(-1) + t.at(-1)); return a }, [0])
  const SLOPE = (() => {
    const n = TIME.length, dl = [], m = new Array(n).fill(0)
    for (let i = 0; i < n - 1; i++) dl.push((LEN[i + 1] - LEN[i]) / (TIME[i + 1] - TIME[i]))
    m[0] = dl[0]; m[n - 1] = dl[n - 2]
    for (let i = 1; i < n - 1; i++) m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : (2 * dl[i - 1] * dl[i]) / (dl[i - 1] + dl[i])
    return m
  })()
  const flownAt = (s) => {
    let i = 0; while (i < TIME.length - 2 && s > TIME[i + 1]) i++
    const h = TIME[i + 1] - TIME[i], t = clamp01((s - TIME[i]) / h), t2 = t * t, t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * LEN[i] + (t3 - 2 * t2 + t) * h * SLOPE[i] + (-2 * t3 + 3 * t2) * LEN[i + 1] + (t3 - t2) * h * SLOPE[i + 1]
  }
  /** the camera at scroll s (screens), framed for a w × h box (a tall phone screen keeps key.keep of the 16:9 width) */
  const cameraAt = (s, w, h) => {
    const L = Math.max(0, Math.min(LEN.at(-1), flownAt(s)))
    let j = 0; while (j < KEYS.length - 2 && L > LEN[j + 1]) j++
    const tab = TABLES[j], d = L - LEN[j]
    let i = 1; while (i < tab.length - 1 && tab[i] < d) i++
    const u = clamp01((i - 1 + (d - tab[i - 1]) / Math.max(1e-6, tab[i] - tab[i - 1])) / (tab.length - 1))
    const a = KEYS[j], b = KEYS[j + 1], e = smooth(u)
    const s0 = a.shift || [0, 0], s1 = b.shift || [0, 0], keep = w >= h ? 1 : lerp(a.keep ?? 0.42, b.keep ?? 0.42, e)
    const look = { eye: crc(EYES, j, u), at: crc(ATS, j, u), fov: lerp(a.fov, b.fov, e), aspect: keep * (16 / 9), shift: [lerp(s0[0], s1[0], e) * keep, lerp(s0[1], s1[1], e)] }
    // the sun's shadows cover the ground around where the camera is looking
    const dy = look.at[1] - look.eye[1], k = dy < -0.01 ? Math.min(1, -look.eye[1] / dy) : 1
    const gx = lerp(look.eye[0], look.at[0], k), gz = lerp(look.eye[2], look.at[2], k)
    return { look, shadow: { x: gx, z: gz, r: Math.max(24, Math.min(80, 16 + Math.abs(look.eye[1]) * 1.1)) }, j, u }
  }
  return { cameraAt, TIME, TOTAL: TIME.at(-1) }
}
