// The estate as the one take's world, read off the masterplan (src/data/sitePlan.js, extracted from the SVG in
// Masterplan.jsx, which was traced from the developer's brochure, p. 5). Plan widths come from the plan; heights are
// estimated from the brochure's small section drawings (p. 12, 16) and say so on the page. docs/world-plan.md has the
// reading.
//
// World: x east, y up, z south (so north is −z). 1 plan unit = K metres; the scale is checked twice against the
// brochure (a villa is 8.4 m wide: 21.5 units; a Courtyard Home is 12.8 m: 33 units). The pool valley floor is y = 0.
import plan from '../data/sitePlan.js'

export const K = 0.39
const OX = 259, OY = 392                                      // the plan point at the world's origin: the middle of the pool valley
export const W = (sx, sy) => [(sx - OX) * K, (sy - OY) * K]   // plan → world [x, z]
export const U = (x, z) => [x / K + OX, z / K + OY]           // world → plan

// floors (estimated from the section: three storeys of 3.4 m below the walkway level)
export const LEVEL = { B2: 0, B1: 3.4, G: 6.8, L1: 10.2, L2: 13.6 }
export const ROOF = 17.2                                      // the set-back storey above the walkway level

// ── the bands, west to east (plan x)
export const BAND = {
  homes: [35.5, 99.5],          // Courtyard Homes, west row
  westDrive: [99.5, 146.5],     // stacked roads with the walkway level over them
  westRow: [146.5, 224],        // Courtyard Villas, west inner row; its pool side faces east
  valley: [224, 272],           // the pool valley (AQUA, B2)
  eastRow: [272, 353.5],        // Courtyard Villas, east inner row; its pool side faces west
  eastDrive: [353.5, 403.5],
  eastOuter: [403.5, 483.5],    // Courtyard Villas, east outer row
}

// ── plots, from the lines across each row (plan y). Groups of 6 / 10 / 6 (inner rows) and 6 / 10 / 9 (east outer),
// with a link block between groups; the Courtyard Homes: 20 down the west side and 12 along the north.
const cuts = (ys) => ys.slice(1).map((y, i) => [ys[i], y])
const INNER = [...cuts([123.5, 145.5, 167.5, 188.5, 209.5, 231.5, 253.5]), ...cuts([268.5, 290.5, 311.5, 332.5, 354.5, 376.5, 397.5, 418.5, 439.5, 461.5, 483.5]), ...cuts([499.5, 521.5, 542.5, 563.5, 585.5, 606.5, 628.5])]
const OUTER = [...cuts([124.5, 146.5, 167.5, 188.5, 210.5, 231.5, 253.5]), ...cuts([269.5, 291.5, 312.5, 333.5, 355.5, 377.5, 398.5, 419.5, 440.5, 462.5, 484.5]), ...cuts([499.5, 521.5, 542.5, 563.5, 585.5, 606.5, 628.5, 650.5, 671.5, 693.5])]
const HOMES_W = cuts([78.5, 109.5, 143.5, 175.5, 207.5, 241.5, 274.5, 307.5, 340.5, 372.5, 405.5, 438.5, 471.5, 503.5, 537.5, 570.5, 604.5, 636.5, 670.5, 701.5, 740.5])
const HOMES_N = cuts([35.5, 114.5, 148.5, 181.5, 213.5, 246, 279.5, 312.5, 344.5, 378.5, 411, 443.5, 483.5])
const box = (sx0, sx1, sy0, sy1) => { const [x0, z0] = W(sx0, sy0), [x1, z1] = W(sx1, sy1); return { x0, x1, z0, z1 } }
/** Every plot: row, its rectangle in world metres, and which side faces the camera's world (face: the side the pool or garden is on) */
export const PLOTS = [
  ...INNER.map(([a, b], i) => ({ row: 'westRow', i, face: 'east', ...box(...BAND.westRow, a, b) })),
  ...INNER.map(([a, b], i) => ({ row: 'eastRow', i, face: 'west', ...box(...BAND.eastRow, a, b) })),
  ...OUTER.map(([a, b], i) => ({ row: 'eastOuter', i, face: 'east', ...box(...BAND.eastOuter, a, b) })),
  ...HOMES_W.map(([a, b], i) => ({ row: 'homes', i, face: 'west', ...box(...BAND.homes, a, b) })),
  ...HOMES_N.map(([a, b], i) => ({ row: 'homesN', i, face: 'north', ...box(a, b, 29, 90) })),
]

// ── SVG paths (M L H V C Z, absolute) as polylines in plan units
export function sample(d, steps = 8) {
  const out = [], toks = d.match(/[MLHVCZ]|-?[\d.]+(?:e-?\d+)?/g)
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, cmd = 'M', cur = null
  const num = () => +toks[i++]
  while (i < toks.length) {
    if (/[MLHVCZ]/.test(toks[i])) cmd = toks[i++]
    if (cmd === 'M') { x = num(); y = num(); sx = x; sy = y; cur = [[x, y]]; out.push(cur); cmd = 'L' }
    else if (cmd === 'L') { x = num(); y = num(); cur.push([x, y]) }
    else if (cmd === 'H') { x = num(); cur.push([x, y]) }
    else if (cmd === 'V') { y = num(); cur.push([x, y]) }
    else if (cmd === 'C') {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num()
      for (let k = 1; k <= steps; k++) {
        const t = k / steps, s = 1 - t
        cur.push([s * s * s * x + 3 * s * s * t * x1 + 3 * s * t * t * x2 + t * t * t * x3, s * s * s * y + 3 * s * s * t * y1 + 3 * s * t * t * y2 + t * t * t * y3])
      }
      x = x3; y = y3
    } else if (cmd === 'Z') { cur.push([sx, sy]); x = sx; y = sy; cmd = 'M'; if (i < toks.length && !/[MLHVCZ]/.test(toks[i])) i++ }
  }
  return out
}

/** Join pieces of one outline end to end (the pool's edge is drawn as many short curves) */
function chain(pieces, tol = 6) {
  const left = pieces.map((p) => p.slice()), out = []
  while (left.length) {
    let line = left.shift(), grew = true
    while (grew) {
      grew = false
      for (let k = 0; k < left.length; k++) {
        const p = left[k], a = line[0], b = line.at(-1), d = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1])
        if (d(b, p[0]) < tol) line = [...line, ...p.slice(1)]
        else if (d(b, p.at(-1)) < tol) line = [...line, ...p.slice(0, -1).reverse()]
        else if (d(a, p.at(-1)) < tol) line = [...p.slice(0, -1), ...line]
        else if (d(a, p[0]) < tol) line = [...p.slice(1).reverse(), ...line]
        else continue
        left.splice(k, 1); grew = true; break
      }
    }
    out.push(line)
  }
  return out
}

// ── facilities: every group of the plan (its id is the legend letter, e.g. aqua-lb2-k = AQUA K), as polylines in world
// metres, with its plan extent and a point for its label
const toW = (pl) => pl.map(([sx, sy]) => W(sx, sy))
const groups = {}
const into = (g, pl) => { if (g) (groups[g] ||= []).push(pl) }
for (const [x1, y1, x2, y2, g] of plan.lines) into(g, [[x1, y1], [x2, y2]])
for (const p of plan.paths) for (const pl of sample(p.d)) into(p.g, pl)
for (const [x, y, w, h, g] of plan.rects) if (g) into(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]])
for (const [cx, cy, r, g] of plan.circles) into(g, Array.from({ length: 25 }, (_, i) => [cx + r * Math.cos((i / 24) * Math.PI * 2), cy + r * Math.sin((i / 24) * Math.PI * 2)]))
export const FACILITY = Object.fromEntries(Object.entries(groups).map(([id, pls]) => {
  const all = pls.flat(), xs = all.map((p) => p[0]), ys = all.map((p) => p[1])
  const ext = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
  return [id, { id, lines: pls.map(toW), ext, at: W((ext.x0 + ext.x1) / 2, (ext.y0 + ext.y1) / 2), ...box(ext.x0, ext.x1, ext.y0, ext.y1) }]
}))

// ── the pool: the edge pieces of AQUA G joined into outlines (north and south water), in world metres
export const POOL = chain(plan.paths.filter((p) => p.g === 'aqua-lb2-g').flatMap((p) => sample(p.d))).map(toW)

// ── the rest of the plan's lines (kerbs, edges, drives), each at the height of the band it lies in
export const LINES = [
  ...plan.lines.filter((l) => !l[4]).map(([x1, y1, x2, y2]) => [[x1, y1], [x2, y2]]),
  ...plan.paths.filter((p) => !p.g && p.stroke).flatMap((p) => sample(p.d)),
].map(toW)

/** Which band a world point is in (by its plan x), and the height of its ground there */
export function bandAt(x, z) {
  const [sx, sy] = U(x, z)
  if (sy < 29 || sy > 745 || sx < 35 || sx > 484) return 'street'
  if (sy < 123 || sy > 629) return sy < 123 ? 'north' : 'south'
  for (const [name, [a, b]] of Object.entries(BAND)) if (sx >= a && sx <= b) return name
  return 'street'
}
export const GROUND = { valley: LEVEL.B2, westDrive: LEVEL.L2, eastDrive: LEVEL.L2, north: LEVEL.L2, south: LEVEL.G, street: LEVEL.G, westRow: ROOF, eastRow: ROOF, eastOuter: ROOF, homes: LEVEL.G }

/** The separate pieces of a facility's outline (segments that touch belong together), each with its extent in metres:
 *  e.g. the four cabanas of AQUA J, or the changing room and sauna side by side. */
export function parts(id) {
  const f = FACILITY[id]; if (!f) return []
  const segs = f.lines.map((pl) => pl.slice()), groups = []
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.6
  for (const s of segs) {
    const hit = groups.filter((g) => g.some((t) => t.some((p) => s.some((q) => near(p, q)))))
    const merged = hit.flat(); merged.push(s)
    for (const h of hit) groups.splice(groups.indexOf(h), 1)
    groups.push(merged)
  }
  return groups.map((g) => {
    const pts = g.flat(), xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1])
    return { lines: g, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), cx: (Math.min(...xs) + Math.max(...xs)) / 2, cz: (Math.min(...zs) + Math.max(...zs)) / 2 }
  }).sort((a, b) => a.cz - b.cz || a.cx - b.cx)
}

/** Each row's plots in their groups (6 / 10 / 6 …, split where the link blocks are), north to south */
export function rowGroups(row) {
  const ps = PLOTS.filter((p) => p.row === row).sort((a, b) => a.z0 - b.z0), out = []
  for (const p of ps) { const g = out.at(-1); if (g && p.z0 - g.at(-1).z1 < 1) g.push(p); else out.push([p]) }
  return out.map((g) => ({ row, plots: g, x0: g[0].x0, x1: g[0].x1, z0: g[0].z0, z1: g.at(-1).z1 }))
}
