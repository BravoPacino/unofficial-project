// The estate in mass, from the masterplan (site.js): every plot raised to its storeys, the stacked roads with the
// walkway level over them and the bridges across, the pool valley with the pool's outline, the green wall at its north
// end, the south garden and the gate. This is the one take's world before any drawn place is set into it; far away it
// is all the world is. Heights are estimated (site.js, LEVEL).
import * as THREE from 'three'
import { BAND, FACILITY, GROUND, LEVEL, LINES, PLOTS, POOL, ROOF, W, bandAt } from './site'

const WHITE = 0.97, SLAB = 0.93, ROAD = 0.86

/**
 * kit: an ink stage kit. inside(x, z): only what stands there is built (a chunk of the world); default everything.
 * faint: the plots drawn as ghosts (the far view), not as white masses with full edges.
 */
// trim: metres of the two inner rows' depth, from their pool-side face, left out because the valley draws them (valley.js)
// skip(plot): plots another drawing stands on (the two homes the take ends at, with their neighbours)
export function estate(kit, { inside = () => true, faint = false, trim = 0, skip = () => false } = {}) {
  const line = faint ? 'ghost' : 'soft'
  const slab = (x0, x1, z0, z1, y, t = 0.3, a = SLAB, o = {}) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
    if (inside(cx, cz)) kit.box(cx, y - t / 2, cz, Math.abs(x1 - x0), t, Math.abs(z1 - z0), a, { line, ...o })
  }
  const mass = (x0, x1, z0, z1, y0, y1, a = WHITE, o = {}) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
    if (inside(cx, cz)) kit.box(cx, (y0 + y1) / 2, cz, Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0), a, { line: faint ? 'ghost' : 'main', flat: faint, ...o })
  }

  // ── grounds: the street round the site at the gate's level, the pool valley's floor two storeys below
  // the street ground has a hole where the site sinks below it (the drives, the rows and the valley inside the Homes
  // and the east outer row): without it, it would lie over the valley floor
  if (inside(0, 0)) {
    // its outer edge lies far past any view's edge (the hero sees the whole site from high above)
    const [ax, az] = W(-1400, -1000), [bx, bz] = W(1900, 1800), [hx0, hz0] = W(99.5, 90), [hx1, hz1] = W(403.5, 705)
    const sh = new THREE.Shape([[ax, -az], [bx, -az], [bx, -bz], [ax, -bz]].map(([x, y]) => new THREE.Vector2(x, y)))
    sh.holes.push(new THREE.Path([[hx0, -hz0], [hx0, -hz1], [hx1, -hz1], [hx1, -hz0]].map(([x, y]) => new THREE.Vector2(x, y))))
    kit.mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2).translate(0, LEVEL.G - 0.01, 0), WHITE, { line: false, cast: false })
  }
  const [vx0] = W(BAND.valley[0], 0), [vx1] = W(BAND.valley[1], 0), [, vz0] = W(0, 123), [, vz1] = W(0, 640)
  kit.mesh(new THREE.PlaneGeometry(vx1 - vx0, vz1 - vz0).rotateX(-Math.PI / 2).translate((vx0 + vx1) / 2, LEVEL.B2 + 0.01, (vz0 + vz1) / 2), WHITE, { line: false, cast: false })

  // ── plots: Courtyard Villas from the valley floor to the walkway level, with the set-back top storey; Courtyard
  //    Homes from the street level up four storeys
  for (const p of PLOTS) {
    if (skip(p)) continue
    if (p.row === 'homes' || p.row === 'homesN') {
      mass(p.x0 + 0.3, p.x1 - 0.3, p.z0 + 0.3, p.z1 - 0.3, LEVEL.G, LEVEL.G + 12.6)
      continue
    }
    const pool = p.face === 'east' ? 1 : -1, inner = p.row === 'westRow' || p.row === 'eastRow'
    if (inner && trim) {                                              // only the drive side of the row: the valley draws the rest
      const x0 = pool > 0 ? p.x0 + 0.2 : p.x0 + trim, x1 = pool > 0 ? p.x1 - trim : p.x1 - 0.2
      mass(x0, x1, p.z0 + 0.2, p.z1 - 0.2, LEVEL.B2, LEVEL.L2)
      mass(x0, x1, p.z0 + 0.6, p.z1 - 0.6, LEVEL.L2, ROOF)
      continue
    }
    const d = p.x1 - p.x0
    mass(p.x0 + 0.2, p.x1 - 0.2, p.z0 + 0.2, p.z1 - 0.2, LEVEL.B2, LEVEL.L2)
    // the top storey stands back from the side facing the pool (or the garden), leaving a terrace
    const tx0 = pool > 0 ? p.x0 + 0.2 : p.x0 + d * 0.22, tx1 = pool > 0 ? p.x1 - d * 0.22 : p.x1 - 0.2
    mass(tx0, tx1, p.z0 + 0.6, p.z1 - 0.6, LEVEL.L2, ROOF)
  }

  // ── the drives: three road levels stacked (B2, G, L1) under the walkway level (L2), which runs as a strip along each
  //    edge, open over the road between; north band the same
  for (const [a, b] of [BAND.westDrive, BAND.eastDrive]) {
    const [x0] = W(a, 0), [x1] = W(b, 0), [, z0] = W(0, 90), [, z1] = W(0, 700), edge = (x1 - x0) * 0.22
    for (let z = z0; z < z1; z += 40) {
      const zz = Math.min(z1, z + 40)
      slab(x0, x1, z, zz, LEVEL.L1 + 0.2, 0.4, ROAD)                                     // the top road, seen through the opening
      slab(x0, x0 + edge, z, zz, LEVEL.L2, 0.4); slab(x1 - edge, x1, z, zz, LEVEL.L2, 0.4)   // the walkway either side of it
    }
  }
  { const [x0, z0] = W(99.5, 90), [x1, z1] = W(403.5, 123); slab(x0, x1, z0, z1, LEVEL.L2, 0.4) }   // north: the walkway across the top
  { const [x0, z0] = W(99.5, 629), [x1, z1] = W(403.5, 705); slab(x0, x1, z0, z1, LEVEL.L2, 0.4) }  // south: the podium over the lobby, its deck a garden

  // ── bridges across the drives (AERO I), from the plan's own outlines, at the walkway level
  const br = FACILITY['aero-l2-i']
  if (br) for (const pl of br.lines) for (let i = 0; i < pl.length - 1; i++) {
    const [ax, az] = pl[i], [bx, bz] = pl[i + 1]
    if (inside((ax + bx) / 2, (az + bz) / 2)) kit.seg([[[ax, LEVEL.L2 + 1.1, az], [bx, LEVEL.L2 + 1.1, bz]]], 'main')
  }

  // ── the pool's edge, on the valley floor; the green wall closing the valley's north end
  for (const ring of POOL) {
    const pairs = []
    for (let i = 0; i < ring.length - 1; i++) if (inside(...ring[i])) pairs.push([[ring[i][0], 0.03, ring[i][1]], [ring[i + 1][0], 0.03, ring[i + 1][1]]])
    kit.seg(pairs, 'main')
  }
  mass(vx0, vx1, vz0 - 1.2, vz0, LEVEL.B2, LEVEL.L2 + 1.2, 0.62, { line: 'main' })     // AQUA A: the planted wall (its planting comes later)

  // ── buildings in the valley and the south garden, from their outlines: changing room, sauna, studio, halls, lobby,
  //    guard house, mailbox (the floating gym and the pools are drawn places)
  const raise = (id, y0, h, a = WHITE) => { const f = FACILITY[id]; if (f) mass(f.x0, f.x1, f.z0, f.z1, y0, y0 + h, a) }
  raise('aqua-lb2-l', LEVEL.B2, 3.2); raise('aqua-lb2-m', LEVEL.B2, 3.2); raise('aqua-lb2-n', LEVEL.B2, 3.6)
  raise('aqua-lb2-tu', LEVEL.G, 4); raise('aqua-lb2-w', LEVEL.G, 4.5)
  raise('aero-lg-c', LEVEL.G, 5); raise('aero-lg-a', LEVEL.G, 3.2); raise('aero-lg-b', LEVEL.G, 3)

  // ── the plan's other lines, each on the ground of the band it lies in: kerbs, drive edges, the site's edge
  const kerb = []
  for (const pl of LINES) for (let i = 0; i < pl.length - 1; i++) {
    const [ax, az] = pl[i], [bx, bz] = pl[i + 1], mx = (ax + bx) / 2, mz = (az + bz) / 2
    if (!inside(mx, mz)) continue
    const y = (GROUND[bandAt(mx, mz)] ?? LEVEL.G) + 0.03
    kerb.push([[ax, y, az], [bx, y, bz]])
  }
  kit.seg(kerb, 'hair')
}
