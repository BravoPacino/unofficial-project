// The pool valley (AQUA, two storeys below the gate), drawn in detail where the camera passes: every outline from the
// masterplan (site.js), drawn the way the traced places are drawn. What the brochure shows in a render is drawn after it
// (the lounge's nests, the gym's treadmills, the cabanas, the pool's ripples and planted islands); what it only names
// is our own design inside its outline (resting and reading nooks, the aqua gym, changing room, sauna, studio, the
// planted wall), and the page says so. k: an adapted kit (adapter.js).
import { FACILITY, POOL, parts, rowGroups } from './site'
import { villaRow } from '../../tools/drawings/scenes/villas.js'
import { pavilion, treadmill, cabana } from '../../tools/drawings/scenes/gym.js'
import { nest } from '../../tools/drawings/scenes/lounge.js'

export const FACE_W = -13.5, FACE_E = 6.0          // the two rows' pool-side faces (the plan's double lines), metres
const inPoly = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c } return c }
const rnd = (i) => { const v = Math.sin(i * 91.7 + 13.1) * 43758.5; return v - Math.floor(v) }
// a facility's outline as one closed ring (its pieces joined)
const ring = (id) => { const ls = FACILITY[id]?.lines || []; return ls.reduce((a, l) => (l.length > a.length ? l : a), []) }

/** Leaves seen face-on on a vertical plane at z = z0 (facing +z): short arcs in clumps, soft lines */
function leaves(k, x0, x1, y0, y1, z0, step, seed = 1) {
  const out = []
  for (let y = y0 + step / 2, r = 0; y < y1; y += step * 0.8, r++) for (let x = x0 + ((r % 2) * step) / 2; x < x1; x += step) {
    const n = 5 + Math.floor(rnd(x * 3 + y + seed) * 3)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(i + x + seed), L = step * (0.35 + rnd(i * 7 + y) * 0.25)
      const p = [x + Math.cos(a) * L * 0.2, y + Math.sin(a) * L * 0.2, z0], q = [x + Math.cos(a) * L, y + Math.sin(a) * L * 0.8, z0 + 0.05]
      out.push([p, q])
    }
  }
  k.seg(out, 'soft')
}

/** AQUA A: the planted wall closing the valley's north end, from the valley floor to the walkway level and its parapet */
export function greenWall(k) {
  const z = -107.4, x0 = FACE_W, x1 = FACE_E
  k.box((x0 + x1) / 2, 7.4, z - 0.5, x1 - x0, 14.8, 1, { a: 0.9 })
  k.seg([[[x0, 13.6, z], [x1, 13.6, z]], [[x0, 14.8, z], [x1, 14.8, z]]])
  leaves(k, x0 + 0.4, x1 - 0.4, 0.4, 13.2, z + 0.02, 0.9, 3)
}

/** The water: both bodies' edges, a soft inner coping line, ripples, the planted island (AQUA I), the stepping stones (C) */
export function water(k, zMin = -Infinity, zMax = Infinity) {
  const rings = POOL.filter((r) => r.length > 20)
  for (const r of POOL) { const z = r.reduce((a, p) => a + p[1], 0) / r.length; if (z >= zMin - 30 && z <= zMax + 30) k.loop(r, 0.03) }
  const isl = ring('aqua-lb2-i')
  if (isl.length > 2) { k.slabShape(isl, 0, 0.42); for (let i = 0; i < 4; i++) k.bush(-0.2 + rnd(i) * 0.8, -55 + i * 3, 0.7 + rnd(i + 3) * 0.3, i * 5 + 2) }
  const rip = []
  for (let z = Math.max(zMin, -104), r = 0; z < Math.min(zMax, 49); z += 0.9, r++) for (let x = -11 + ((r * 1.7) % 2.4); x < 4.5; x += 2.2 + (r % 3) * 0.5) {
    const a = [x, z], b = [x + 0.5, z + 0.05], c = [x + 1, z]
    if ([a, b, c].every((p) => rings.some((g) => inPoly(g, ...p)) && !(isl.length > 2 && inPoly(isl, ...p)))) rip.push([[a[0], 0.03, a[1]], [b[0], 0.03, b[1]]], [[b[0], 0.03, b[1]], [c[0], 0.03, c[1]]])
  }
  k.seg(rip, 'soft')
  // C: two lines of stepping stones across the water
  for (const p of parts('aqua-lb2-c')) for (let x = p.x0 + 0.5; x < p.x1; x += 1.25) {
    const st = Array.from({ length: 7 }, (_, i) => { const t = (i / 7) * Math.PI * 2; return [x + Math.cos(t) * 0.45, p.cz + Math.sin(t) * 0.32] })
    k.slabShape(st, 0, 0.12, true)
  }
}

/** AQUA D: the lounge deck, its outline from the plan, boards along it, and the two rattan nests (as in the render) */
export function deck(k, eye) {
  const d = ring('aqua-lb2-d'), f = FACILITY['aqua-lb2-d']
  if (d.length > 2) k.slabShape(d, 0, 0.15)
  const boards = []
  for (let x = f.x0 + 0.15; x < f.x1; x += 0.22) {
    let run = null
    for (let z = f.z0; z <= f.z1; z += 0.1) {
      const ins = d.length > 2 && inPoly(d, x, z)
      if (ins && !run) run = [z, z]; else if (ins) run[1] = z; else if (run) { boards.push([[x, 0.151, run[0]], [x, 0.151, run[1]]]); run = null }
    }
    if (run) boards.push([[x, 0.151, run[0]], [x, 0.151, run[1]]])
  }
  k.seg(boards, 'soft')
  const cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2
  nest(k, cx - 0.4, cz - 2.6, -Math.PI / 2 + 0.35, 0.3, eye, 1.05)       // the openings face the water (west)
  nest(k, cx - 0.2, cz + 2.4, -Math.PI / 2 - 0.15, 0.28, eye, 1.0)
}

/** AQUA J: the poolside cabanas, one in each square of the plan */
export function cabanas(k) {
  for (const p of parts('aqua-lb2-j')) {
    const xs = p.x1 - p.x0 > 6 ? [p.x0 + 2.2, p.x1 - 2.2] : [p.cx]
    for (const x of xs) cabana(k, x, p.cz, x < -4 ? Math.PI / 2 : -Math.PI / 2)
  }
}

/** AQUA K: the floating gym, its glass room inside the plan's outline, four treadmills facing south over the water */
export const GYM = { cx: -4.45, front: -18.2, W: 10, D: 13, H: 5 }
export function gym(k, eye) {
  const { cx, front, W, D, H } = GYM
  pavilion(k, { ox: cx, oz: front, ry: 0, W, D, H, eye, back: false })
  for (const dx of [-2.205, -0.735, 0.735, 2.205]) treadmill(k, cx + dx, front - 3.3, Math.PI)
}

/** Our own designs, inside the plan's outlines (no image of these was published) */
export function ownDesigns(k) {
  const slats = (x0, x1, z0, z1, h) => {                         // a box clad in vertical timber slats, a door in its west side
    k.box((x0 + x1) / 2, h / 2, (z0 + z1) / 2, x1 - x0, h, z1 - z0, { a: 0.78, soft: true })
    k.box((x0 + x1) / 2, h + 0.12, (z0 + z1) / 2, x1 - x0 + 0.5, 0.24, z1 - z0 + 0.5)
    const s = []
    for (let x = x0 + 0.15; x < x1; x += 0.18) s.push([[x, 0.05, z1 + 0.01], [x, h - 0.05, z1 + 0.01]], [[x, 0.05, z0 - 0.01], [x, h - 0.05, z0 - 0.01]])
    for (let z = z0 + 0.15; z < z1; z += 0.18) s.push([[x1 + 0.01, 0.05, z], [x1 + 0.01, h - 0.05, z]])
    k.seg(s, 'hair')
    k.box(x0 - 0.02, 1.1, (z0 + z1) / 2, 0.06, 2.2, 1.0, { a: 0.18 })
  }
  // L changing room, M sauna
  for (const id of ['aqua-lb2-l', 'aqua-lb2-m']) { const f = FACILITY[id]; if (f) slats(f.x0 + 0.3, f.x1 - 0.3, f.z0 + 0.3, f.z1 - 0.3, 3.2) }
  // N fitness studio: a flat-roofed glass room
  const n = FACILITY['aqua-lb2-n']
  if (n) {
    const x0 = n.x0 + 0.5, x1 = n.x1 - 0.5, z0 = n.z0 + 0.5, z1 = n.z1 - 0.5, h = 3.6
    k.box((x0 + x1) / 2, h + 0.2, (z0 + z1) / 2, x1 - x0 + 1.2, 0.4, z1 - z0 + 1.2)
    k.box((x0 + x1) / 2, 0.1, (z0 + z1) / 2, x1 - x0, 0.2, z1 - z0, { soft: true })
    const m = []
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 5) m.push([[x, 0.2, z0], [x, h, z0]], [[x, 0.2, z1], [x, h, z1]])
    for (let z = z0; z <= z1 + 0.01; z += (z1 - z0) / 6) m.push([[x0, 0.2, z], [x0, h, z]], [[x1, 0.2, z], [x1, h, z]])
    k.seg(m)
    k.box((x0 + x1) / 2, h / 2, (z0 + z1) / 2, x1 - x0 - 0.6, h - 0.4, z1 - z0 - 0.6, { a: 0.2, edges: false })   // the room behind the glass, in shade
  }
  // B resting nooks, H reading nook: low timber benches along the west side, with a back
  for (const id of ['aqua-lb2-b', 'aqua-lb2-h']) {
    const f = FACILITY[id]; if (!f) continue
    k.box(f.x0 + 0.9, 0.22, (f.z0 + f.z1) / 2, 0.7, 0.44, f.z1 - f.z0 - 0.6, { soft: true })
    k.box(f.x0 + 0.5, 0.6, (f.z0 + f.z1) / 2, 0.12, 1.2, f.z1 - f.z0 - 0.6, { soft: true })
  }
  // E aqua gym: an open timber frame with a slatted roof over the water's edge
  const e = FACILITY['aqua-lb2-e']
  if (e) {
    const x0 = e.x0, x1 = e.x1 + 0.6, z0 = e.z0, z1 = e.z1, h = 3
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) k.box(x, h / 2, z, 0.2, h, 0.2)
    for (let z = z0; z <= z1; z += 0.35) k.box((x0 + x1) / 2, h + 0.1, z, x1 - x0 + 0.3, 0.08, 0.1, { soft: true })
  }
}

/** The planting along both rows' faces (AQUA F, designer landscape): a low planter, trees standing in it */
// clear(z): stretches with no tree (in front of the villa the take ends at)
export function edges(k, zMin = -108, zMax = 93, clear = () => false) {
  for (const p of parts('aqua-lb2-f')) {
    if (p.z1 < zMin || p.z0 > zMax) continue
    const west = p.cx < -4, x0 = west ? FACE_W : FACE_E - 1.3, x1 = west ? FACE_W + 1.3 : FACE_E
    if ((west && p.cx > -13.6) || (!west && p.cx < 6.4)) continue        // one planter per side: draw it from the outer line
    k.slabShape([[x0, p.z0], [x1, p.z0], [x1, p.z1], [x0, p.z1]], 0, 0.5, true, 0.86)
    leaves({ seg: (pairs, w) => k.seg(pairs.map(([a, b]) => [[a[0], a[2] + 0.55, a[1]], [b[0], b[2] + 0.55, b[1]]]), w) }, x0 + 0.2, x1 - 0.2, p.z0 + 0.3, p.z1 - 0.3, 0, 0.7, west ? 5 : 9)
    for (let z = p.z0 + 5, i = 0; z < p.z1 - 3; z += 11, i++) if (!clear(z)) k.tree((x0 + x1) / 2, z, 9 + (i % 3), 2.6, i * 3 + (west ? 1 : 2))
  }
}

/** The two rows' pool-side faces, group by group (villaRow, the Courtyard Villas facade traced from the render) */
// hole(plot): plots another drawing stands on (the villa the take ends at, with its neighbours): the row is drawn in runs
export function facades(k, zMin = -Infinity, zMax = Infinity, hole = () => false) {
  for (const row of ['westRow', 'eastRow']) for (const g of rowGroups(row)) {
    if (g.z1 < zMin || g.z0 > zMax) continue
    const runs = []
    for (const p of g.plots) { if (hole(p)) { runs.push([]); continue } if (!runs.length) runs.push([]); runs.at(-1).push(p) }
    for (const r of runs.filter((r) => r.length)) {
      const n = r.length
      if (row === 'westRow') villaRow(k, { n, ox: FACE_W, oz: r.at(-1).z1, ry: Math.PI / 2, ground: false, yard: false })
      else villaRow(k, { n, ox: FACE_E, oz: r[0].z0, ry: -Math.PI / 2, ground: false, yard: false })
    }
  }
}
