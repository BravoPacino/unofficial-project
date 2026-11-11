// The rest of the one take's world, drawn in detail where the camera passes (docs/world-plan.md §2.3): the gate and
// the podium over it, the east drive with its stacked roads, walkway level and bridges, the pool valley's south end
// (the splash pool's ship, the treehouse, the lawn), and the two homes the take ends at. Outlines from the masterplan
// (site.js); the way they are drawn follows the traced renders; what was never shown is our own design and is marked
// so on the page. k: an adapted kit (adapter.js) unless said otherwise.
import * as THREE from 'three'
import { BAND, FACILITY, LEVEL, W, parts } from './site'
import { cabana } from '../../tools/drawings/scenes/gym.js'
import { treeGeometry } from './adapter'
import entrance from '../../tools/drawings/scenes/entrance.js'

const rnd = (i) => { const v = Math.sin(i * 91.7 + 13.1) * 43758.5; return v - Math.floor(v) }
const hull = (pts) => {                                         // convex hull (monotone chain) of [x, z] points
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo = [], up = []
  for (const q of p) { while (lo.length > 1 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q) }
  for (const q of p.slice().reverse()) { while (up.length > 1 && cr(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q) }
  return lo.slice(0, -1).concat(up.slice(0, -1))
}
const leafClumps = (k, pts, y, step, seed) => {                // planting seen from above: clumps of short strokes over a bed
  const out = []
  for (const [x, z] of pts) {
    const n = 6
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rnd(x + z + i + seed), L = step * (0.3 + rnd(i * 3 + x) * 0.25); out.push([[x, y, z], [x + Math.cos(a) * L, y + 0.25, z + Math.sin(a) * L]]) }
  }
  k.seg(out, 'soft')
}

// ── the gate: the portal and guard house as traced (entrance.js, its portal only), set on the street at the site's
//    south edge; the podium the lobby sits under, its deck at the walkway level with the observation pavilions and
//    planted beds on it
export const GATE = { x: -12, z: 132, y: LEVEL.G }               // the portal's front edge, middle
export function gate(k) {
  const p = k.place(GATE.x, GATE.z, 0, GATE.y)
  entrance({ ...k, box: p.box, seg: p.seg, line: (pts, y, soft) => p.seg(pts.slice(0, -1).map((a, i) => [[a[0], y, a[1]], [pts[i + 1][0], y, pts[i + 1][1]]]), soft), groundPlane: () => {} }, { only: true })
  // the podium: its south face from the street to the deck, broken by the portal
  const [px0] = W(BAND.westDrive[0], 0), [px1] = W(BAND.eastDrive[1], 0), [, pz] = W(0, 705), H = LEVEL.L2 - LEVEL.G
  for (const [a, b] of [[px0, GATE.x - 8], [GATE.x + 8, px1]]) k.box((a + b) / 2, LEVEL.G + H / 2, pz - 0.4, b - a, H, 0.8)
  // on the deck: the observation pavilions (AERO F) at the two corners, the planted beds (the plan's garden outlines)
  for (const q of parts('aero-l2-f')) cabana({ ...k, place: (x, z, ry) => k.place(x, z, ry, LEVEL.L2) }, q.cx, q.cz, 0)
  for (const id of ['aqua-lb2-tu', 'aqua-lb2-w', 'aero-e-aqua-v']) {
    const f = FACILITY[id]; if (!f) continue
    for (const pl of f.lines) if (pl.length > 6) {
      k.seg(pl.slice(0, -1).map((a, i) => [[a[0], LEVEL.L2 + 0.6, a[1]], [pl[i + 1][0], LEVEL.L2 + 0.6, pl[i + 1][1]]]), 'main')
      const pts = []; for (let i = 0; i < pl.length; i += 3) pts.push(pl[i])
      leafClumps(k, pts, LEVEL.L2 + 0.6, 1.6, id.length)
      // trees in the beds (the plan shows them crowded with trees)
      for (let i = 0; i < pl.length; i += 9) k.mesh(treeGeometry(pl[i][0], pl[i][1], 7 + (i % 3), i + id.length).translate(0, LEVEL.L2 + 0.6, 0), { a: 0.04, line: false })
    }
  }
  // the lobby (AERO C, ground level) under the deck, glazed towards the portal
  const c = FACILITY['aero-lg-c']
  if (c) { const s = []; for (let x = c.x0; x <= c.x1 + 0.01; x += (c.x1 - c.x0) / 4) s.push([[x, LEVEL.G, c.z1], [x, LEVEL.L2 - 0.4, c.z1]]); k.seg(s) }
}

// ── the east drive, seen from the walkway level: the top road (level 1) with a garage door per home along both walls,
//    the walkway along each edge with its railing and trees, the bridges across (the plan's own outlines), the
//    multipurpose track (AERO H) and the fitness zones (AERO G, our own design)
export function drive(k, z0, z1) {
  const [x0] = W(BAND.eastDrive[0], 0), [x1] = W(BAND.eastDrive[1], 0), edge = (x1 - x0) * 0.22, road = LEVEL.L1 + 0.4
  const bars = [], rails = []
  for (const [xa, xb, side] of [[x0, x0 + edge, 1], [x1 - edge, x1, -1]]) {
    const xe = side > 0 ? xb : xa                                 // the walkway's edge over the road
    for (let z = z0; z < z1; z += 0.14) bars.push([[xe, LEVEL.L2, z], [xe, LEVEL.L2 + 1.1, z]])
    rails.push([[xe, LEVEL.L2 + 1.1, z0], [xe, LEVEL.L2 + 1.1, z1]], [[xe, LEVEL.L2 + 1.0, z0], [xe, LEVEL.L2 + 1.0, z1]])
    // the garage doors in the wall under the walkway, one per 8.4 m
    const xw = side > 0 ? xa + 0.02 : xb - 0.02
    for (let z = Math.ceil(z0 / 8.4) * 8.4; z < z1 - 3; z += 8.4) k.box(xw + side * 0.05, road + 1.25, z + 1.5, 0.1, 2.5, 3, { a: 0.2, edges: false })
    for (let z = z0 + 4, i = 0; z < z1; z += 9, i++) k.tree((xa + xb) / 2, z, 8 + (i % 3), 2.4, i * 3 + (side > 0 ? 11 : 17))
  }
  k.seg(bars, 'hair'); k.seg(rails)
  // the rows' faces over the walkway: for each home, the storey above the walkway level glazed in a white frame, a
  // panel of timber fins beside it (our reading: the brochure only shows the drive in one picture, from the bridge)
  for (const [xf, side] of [[x0 - 0.05, -1], [x1 + 0.05, 1]]) {
    const fins = [], frames = []
    for (let z = Math.ceil(z0 / 8.4) * 8.4; z < z1 - 8; z += 8.4) {
      const y0 = LEVEL.L2 + 0.5, y1 = LEVEL.L2 + 3.2
      k.box(xf - side * 0.06, (y0 + y1) / 2, z + 2.6, 0.1, y1 - y0, 4.2, { a: 0.25, edges: false })
      frames.push([[xf, y0, z + 0.5], [xf, y0, z + 4.7]], [[xf, y1, z + 0.5], [xf, y1, z + 4.7]], [[xf, y0, z + 0.5], [xf, y1, z + 0.5]], [[xf, y0, z + 4.7], [xf, y1, z + 4.7]], [[xf, y0, z + 2.6], [xf, y1, z + 2.6]])
      for (let u = z + 5.2; u < z + 7.9; u += 0.22) fins.push([[xf, LEVEL.L2 + 0.3, u], [xf, LEVEL.L2 + 3.4, u]])
    }
    k.seg(frames); k.seg(fins, 'soft')
  }
  // the road: its kerbs and a dashed middle line
  const dash = []; for (let z = z0; z < z1; z += 3) dash.push([[(x0 + x1) / 2, road + 0.01, z], [(x0 + x1) / 2, road + 0.01, z + 1.4]])
  k.seg(dash, 'soft'); k.seg([[[x0 + edge, road + 0.01, z0], [x0 + edge, road + 0.01, z1]], [[x1 - edge, road + 0.01, z0], [x1 - edge, road + 0.01, z1]]], 'soft')
  // bridges: each outline of AERO I as a deck at the walkway level, railings of close white bars both sides (as traced)
  for (const b of parts('aero-l2-i')) {
    if (b.cx < x0 - 2 || b.cx > x1 + 2 || b.z1 < z0 || b.z0 > z1) continue
    const h = hull(b.lines.flat())
    if (h.length < 3) continue
    k.slabShape(h, LEVEL.L2 - 0.35, 0.35)
    const fb = []
    for (let i = 0; i < h.length; i++) {
      const a = h[i], c = h[(i + 1) % h.length], d = Math.hypot(c[0] - a[0], c[1] - a[1])
      if (d < 3) continue                                         // only the long sides carry railings
      for (let t = 0.1; t < d; t += 0.14) fb.push([[a[0] + ((c[0] - a[0]) * t) / d, LEVEL.L2, a[1] + ((c[1] - a[1]) * t) / d], [a[0] + ((c[0] - a[0]) * t) / d, LEVEL.L2 + 1.1, a[1] + ((c[1] - a[1]) * t) / d]])
    }
    k.seg(fb, 'soft')
  }
  // the multipurpose track, along the walkway (the plan's lines), and the fitness zones
  const tr = FACILITY['aero-l2-h']
  if (tr) k.seg(tr.lines.flatMap((pl) => pl.slice(0, -1).map((a, i) => [[a[0], LEVEL.L2 + 0.02, a[1]], [pl[i + 1][0], LEVEL.L2 + 0.02, pl[i + 1][1]]])).filter(([a]) => a[0] > x0 - 3 && a[2] > z0 && a[2] < z1), 'soft')
  for (const g of parts('aero-l2-g')) {
    if (g.cx < x0 - 3 || g.z1 < z0 || g.z0 > z1) continue
    k.box(g.cx, LEVEL.L2 + 0.03, g.cz, g.x1 - g.x0, 0.06, g.z1 - g.z0, { soft: true })
    for (let z = g.z0 + 1.5; z < g.z1 - 1; z += 2.4) { k.box(g.cx - 0.6, LEVEL.L2 + 1.1, z, 0.12, 2.2, 0.12); k.box(g.cx + 0.6, LEVEL.L2 + 1.1, z, 0.12, 2.2, 0.12); k.box(g.cx, LEVEL.L2 + 2.2, z, 1.4, 0.1, 0.1) }
  }
}

// ── the pool valley's south end: the kids' splash pool (Q) with the timber ship in it, as in the brochure's aerial;
//    the kids' adventure treehouse (R) drawn after the brochure's picture of it: a deck round a big tree, a rail, a
//    stair and a slide; the social lawn (S)
export function south(k) {
  const q = FACILITY['aqua-lb2-q']
  if (q) {
    const [cx, cz] = q.at, r = (q.x1 - q.x0) / 2
    k.loop(Array.from({ length: 32 }, (_, i) => [cx + Math.cos((i / 32) * Math.PI * 2) * r, cz + Math.sin((i / 32) * Math.PI * 2) * r]), 0.03)
    const sh = k.place(cx, cz, 0.5)
    k.mesh(sh.geo(k.prismX([[-2.4, 1.1], [2.7, 1.3], [2.1, 0.0], [-1.8, 0.0]], 0, 1.8)), { angle: 20 })
    sh.box(0, 3, 0.4, 0.12, 3.8, 0.12); sh.box(0, 1.9, -1.6, 1.6, 1.2, 1.0)
    const sail = []; for (let y = 1.9; y <= 4.2; y += 0.3) sail.push([[-0.7, y, 0.46], [0.7, y, 0.46]]); sh.seg(sail, 'soft')
  }
  const t = FACILITY['aqua-lb2-r']
  if (t) {
    const cx = (t.x0 + t.x1) / 2, cz = (t.z0 + t.z1) / 2 + 1, R = 3.6, h = 3.2
    k.tree(cx, cz, 13, 4.8, 21)
    const ring = Array.from({ length: 21 }, (_, i) => [cx + Math.cos((i / 20) * Math.PI * 2) * R, cz + Math.sin((i / 20) * Math.PI * 2) * R])
    const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)))
    shape.holes.push(new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(cx + (x - cx) * 0.25, -(cz + (z - cz) * 0.25)))))
    k.mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, h, 0), { angle: 30 })
    for (let i = 0; i < 20; i += 4) k.box(ring[i][0], h / 2, ring[i][1], 0.24, h, 0.24)
    const rail = []
    for (let i = 0; i < 20; i++) { rail.push([[ring[i][0], h + 1.2, ring[i][1]], [ring[i + 1][0], h + 1.2, ring[i + 1][1]]]); for (let s = 0; s < 1; s += 0.34) { const x = ring[i][0] + (ring[i + 1][0] - ring[i][0]) * s, z = ring[i][1] + (ring[i + 1][1] - ring[i][1]) * s; rail.push([[x, h + 0.3, z], [x, h + 1.2, z]]) } }
    k.seg(rail, 'soft')
    const slide = []
    for (let i = 0; i < 20; i++) { const f = (u) => [cx + R + Math.cos(u * 2.4) * 2.2, h - u * h, cz + Math.sin(u * 2.4) * 2.2]; slide.push([f(i / 20), f((i + 1) / 20)]) }
    k.seg(slide, 'heavy')
    const st = []; for (let i = 0; i <= 8; i++) st.push([[cx - R - 1.6, (i / 8) * h, cz - 1 + (i / 8) * 2.2], [cx - R - 0.6, (i / 8) * h, cz - 1 + (i / 8) * 2.2]]); k.seg(st)
  }
  const s = FACILITY['aqua-lb2-s']
  if (s) for (const pl of s.lines) { k.seg(pl.slice(0, -1).map((a, i) => [[a[0], 0.02, a[1]], [pl[i + 1][0], 0.02, pl[i + 1][1]]]), 'main'); k.slabShape(pl, 0, 0.12, true, 0.9) }
}
