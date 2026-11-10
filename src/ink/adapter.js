// Lets the line-drawing scenes in tools/drawings/scenes/ build into an ink stage unchanged: the same calls
// (box, seg, mesh, slabShape, tree, …) as tools/drawings/kit.js, but every face carries a grey for the ink tone.
// A scene may pass { a: grey } in a box's or mesh's options; anything without one is white.
// Trees here are 3D bare branches, so they hide what is behind them and cast real shadows.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const WHITE = 0.97, SECONDARY = 0.8           // secondary parts (drawn with soft edges in the line scenes): timber, slats, fins, decks
const weight = (soft) => (soft ? 'soft' : 'main')
const rng = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** A bare tree as one mesh: a trunk forking again and again, every branch a thin tapering cylinder */
export function treeGeometry(x, z, h, seed, { depth = 8, spread = 1 } = {}) {
  const r = rng(Math.round(seed * 1000) + 7), parts = []
  const up = new THREE.Vector3(0, 1, 0)
  const grow = (p, dir, len, rad, d) => {
    const end = p.clone().addScaledVector(dir, len)
    const g = new THREE.CylinderGeometry(rad * 0.7, rad, len, 5, 1, true)
    g.applyMatrix4(new THREE.Matrix4().compose(p.clone().lerp(end, 0.5), new THREE.Quaternion().setFromUnitVectors(up, dir), new THREE.Vector3(1, 1, 1)))
    parts.push(g)
    if (d >= depth || len < 0.18) return
    const n = d === 0 ? 3 : r() < 0.3 ? 3 : 2
    for (let i = 0; i < n; i++) {
      const az = r() * Math.PI * 2, tilt = (d < 2 ? 0.55 : 0.42) * spread * (0.7 + r() * 0.6)
      const side = new THREE.Vector3(Math.cos(az), 0, Math.sin(az))
      const nd = dir.clone().multiplyScalar(0.82).addScaledVector(side, Math.sin(tilt)).addScaledVector(up, 0.12).normalize()
      grow(end, nd, len * (0.68 + r() * 0.18), rad * (n === 3 ? 0.62 : 0.7), d + 1)
    }
  }
  grow(new THREE.Vector3(x, 0, z), up.clone(), h * 0.3, h * 0.013, 0)
  return mergeGeometries(parts)
}

/**
 * focus(x, y, z): is this point part of the one thing the drawing is about? Anything whose centre is not is a ghost:
 * flat paper, faint lines, no shadow of its own, so the eye stays on the subject. No focus: everything is drawn in full.
 */
export function adaptKit(ink, focus = null) {
  const inFocus = (x, y, z) => !focus || focus(x, y, z)
  const centre = (g) => { g.computeBoundingBox(); const c = new THREE.Vector3(); g.boundingBox.getCenter(c); return c }
  const GHOST = (a) => 1 - (1 - a) * 0.06
  const seg = (pairs, soft = false) => {
    const w = typeof soft === 'string' ? soft : weight(soft), keep = [], ghost = []
    for (const pq of pairs) { const [p, q] = pq; (inFocus((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2) ? keep : ghost).push(pq) }
    if (keep.length) ink.seg(keep, focus && w === 'main' ? 'heavy' : w)
    if (ghost.length) ink.seg(ghost, 'ghost')
  }
  const put = (g, a, { line, angle, flat, cast }) => {
    const c = centre(g)
    if (inFocus(c.x, c.y, c.z)) return ink.mesh(g, a, { line: focus && line === 'main' ? 'heavy' : line, angle, flat, cast })
    return ink.mesh(g, GHOST(a), { line: line ? 'ghost' : false, angle, flat: true, cast: false, shade: false })
  }
  const mesh = (g, { soft = false, angle = 25, a = WHITE, line, flat = false, cast = true } = {}) =>
    put(g, a, { line: line ?? weight(soft), angle, flat, cast })
  const box = (x, y, z, w, h, d, { ry = 0, soft = false, edges = true, a = soft ? SECONDARY : WHITE, flat = false, cast = true } = {}) => {
    const g = new THREE.BoxGeometry(w, h, d).applyMatrix4(new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z))
    return put(g, a, { line: edges ? weight(soft) : false, angle: 1, flat, cast })
  }
  // trees: in full only when they stand inside the subject; outside it they are left out (a grey stipple tree reads as dirt)
  const plant = (g, x, y, z) => (inFocus(x, y, z) ? ink.mesh(g, 0.04, { line: false, cast: true }) : null)
  const tree = (x, z, h = 7, ...[, seed = 1]) => plant(treeGeometry(x, z, h, seed), x, h * 0.6, z)
  const bush = (x, z, r = 1, seed = 1) => plant(treeGeometry(x, z, r * 1.5, seed + 0.5, { depth: 6, spread: 1.6 }), x, r * 0.5, z)
  const smoothLoop = (pts, n = 8) => {
    const out = []
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length]
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t
        out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)))
      }
    }
    return out
  }
  const smoothLine = (pts, n = 8) => {
    const out = [], L = pts.length, P = (i) => pts[Math.max(0, Math.min(L - 1, i))]
    for (let i = 0; i < L - 1; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t
        out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)))
      }
    }
    out.push(pts[L - 1])
    return out
  }
  const loop = (pts, y, soft = false) => seg(pts.map((a, i) => { const b = pts[(i + 1) % pts.length]; return [[a[0], y, a[1]], [b[0], y, b[1]]] }), soft)
  const line = (pts, y, soft = false) => seg(pts.slice(0, -1).map((a, i) => [[a[0], y, a[1]], [pts[i + 1][0], y, pts[i + 1][1]]]), soft)
  const slabShape = (pts, y0, h, soft = false, a = WHITE) => {
    const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))
    const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 1 })
    g.rotateX(-Math.PI / 2); g.translate(0, y0, 0)
    return ink.mesh(g, a, { line: weight(soft), angle: 25 })
  }
  const plate = (x, y, z, w, h, ry = 0) => {
    const g = new THREE.PlaneGeometry(w, h).applyMatrix4(new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z))
    ink.mesh(g, WHITE, { line: false })
  }
  const groundPlane = (y = 0) => ink.mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2).translate(0, y - 0.005, 0), WHITE, { line: false, cast: false })
  const ribbon = (A, B, yA, yB) => {
    const v = []
    for (let i = 0; i < A.length - 1; i++) {
      const a0 = [A[i][0], yA, A[i][1]], a1 = [A[i + 1][0], yA, A[i + 1][1]], b0 = [B[i][0], yB, B[i][1]], b1 = [B[i + 1][0], yB, B[i + 1][1]]
      v.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals()
    ink.mesh(g, WHITE, { line: false })
  }
  const place = (ox, oz, ry = 0, oy = 0) => {
    const cs = Math.cos(ry), sn = Math.sin(ry)
    const T = (x, y, z) => [ox + x * cs + z * sn, y + oy, oz - x * sn + z * cs]
    return {
      T,
      box: (x, y, z, w, h, d, o = {}) => { const [X, Y, Z] = T(x, y, z); return box(X, Y, Z, w, h, d, { ...o, ry: ry + (o.ry || 0) }) },
      seg: (pairs, soft) => seg(pairs.map(([p, q]) => [T(...p), T(...q)]), soft),
      geo: (g) => g.applyMatrix4(new THREE.Matrix4().makeRotationY(ry).setPosition(ox, oy, oz)),
    }
  }
  const prismX = (pts, x, t) => {
    const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)))
    const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 6 })
    g.rotateY(-Math.PI / 2); g.translate(x + t / 2, 0, 0)
    return g
  }
  const column = (x, z, r, y0, y1, _eye, soft = false) => mesh(new THREE.CylinderGeometry(r, r, y1 - y0, 20).translate(x, (y0 + y1) / 2, z), { soft, angle: 40, a: 0.9 })
  // smooth shells (the lounge nests): the crease edges stand in for the silhouette
  const smooth = (g, _eye, { soft = false, angle = 35, crease = true } = {}) => mesh(g, { soft, angle: crease ? angle : 60, a: 0.9 })
  const car = (x, z, ry = 0, oy = 0) => {
    const p = place(x, z, ry, oy)
    p.box(0, 0.75, 0, 1.8, 0.8, 4.5, { a: 0.7 }); p.box(0, 1.45, 0.25, 1.6, 0.6, 2.3, { a: 0.45 })
    for (const [dx, dz] of [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]]) mesh(p.geo(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 16).rotateZ(Math.PI / 2).translate(dx, 0.34, dz)), { angle: 40, a: 0.12 })
  }
  return { THREE, box, mesh, seg, plate, tree, bush, smoothLoop, smoothLine, loop, line, slabShape, groundPlane, car, place, column, prismX, smooth, ribbon, P: {}, scene: null }
}
