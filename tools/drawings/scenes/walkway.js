// 人行桥：照效果图画。从高处看：一条下沉的车道（两边挡土墙、墙上一个个车库口）一直往远处弯过去，
// 一座很宽的人行桥斜着跨过去（两边密的白色竖条栏杆）；右边一排白色方盒子房子（白色厚门框、木百叶窗、门前花槽），
// 左边是人行道和花池。米数是按图估的。

const offset = (pts, d) => pts.map((p, i) => {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1])
  const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L
  return [p[0] + tz * d, p[1] - tx * d]
})
/** 沿折线按弧长取点：返回 [点, 切线] */
function along(pts, s) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az)
    if (s <= L) return [[ax + ((bx - ax) * s) / L, az + ((bz - az) * s) / L], [(bx - ax) / L, (bz - az) / L]]
    s -= L
  }
  return null
}


// ── 照手册第 10 页（同网站效果图）一笔一笔对着画。镜头、车道宽、墙高、桥的位置是用图上读出的线反解的
// （tools/ink/fit-walkway.cjs，tools/ink 的 unp 把图上的点反投到地面上量的）。米数都是按图估的。
// 世界坐标：x 横过车道（右岸 +），z 顺着车道（离镜头越远越负），y 向上；人行道面 y = 0，车道面 y = -3.2。
const DEPTH = 3.2, WALL = 1.3
export const VIEW = { eye: [-8.2, 8.9, 21.2], at: [7.8, -1.35, -8.6], fov: 51.5 }

// 车道两边（挡土墙顶），从镜头这头往远：右边基本是直的，远处往左弯；左边一路往左偏一点、远处一起左弯
const RE = [[5.62, 40], [5.62, 0], [5.45, -40], [4.9, -80], [2.5, -108], [-5, -132], [-18, -152], [-34, -168]]
const LE = [[-5.9, 40], [-6.06, 12.9], [-6.57, 9.1], [-7.09, 4.06], [-8.09, -12.1], [-8.89, -56], [-9.6, -80], [-13, -102], [-21, -124], [-34, -142], [-48, -156]]

// 人行桥（平面）：近边是一道密白竖条的栏板，从右下一直伸出画面；到左头顺着弧拐弯，沿左岸往远走一段。
// 远边是矮实墙 + 竖条，右头在房子前的人行道上收成圆头，左头接上车道左侧的护墙。桥面在两条之间，左头是一条往远走的步道。
const arc = (a, b, c, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, s = 1 - t; return [s * s * a[0] + 2 * s * t * b[0] + t * t * c[0], s * s * a[1] + 2 * s * t * b[1] + t * t * c[1]] })
const NEAR = [[12, 24.5], [5.18, 16.97], [3.08, 13.92], [-3.03, 6.66], [-8.4, 0.45], ...arc([-9.6, -0.9], [-11.3, -2.9], [-11.6, -6.7], 6).slice(1), [-12.06, -11.65], [-12.3, -14.6]]
const FAR = [[4.25, 10.3], [-0.64, 0.36], [-5.6, -7.6], ...arc([-6.6, -9.1], [-7.6, -10.6], [-7.8, -12.6], 4).slice(1), [-8.0, -14.6]]
export const DECK = [...NEAR, ...FAR.slice().reverse(), [6.6, 12.6], [6.6, 18.6]]
const inPoly = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c } return c }
export const BRIDGE = { DECK, inPoly }

export default function walkway(k) {
  const { smoothLine, smoothLoop, line, loop, slabShape, seg, box, mesh, THREE } = k
  k.groundPlane(-DEPTH)
  const lens = (pts) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0)
  const R = smoothLine(RE, 6), L = smoothLine(LE, 6)
  // ── the two banks (paper at y 0) and the road (paper at y -3.2); retaining-wall faces as bands
  k.ribbon(L, offset(L, 70), 0, 0); k.ribbon(R, offset(R, -70), 0, 0)
  k.ribbon(L, L, 0, -DEPTH)
  line(L, 0); line(L, -DEPTH); line(R, -DEPTH)
  // road: a centre line of short dashes
  const C = L.map((p, i) => { const q = R[Math.min(R.length - 1, Math.round((i / (L.length - 1)) * (R.length - 1)))]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] })
  const dash = []; for (let i = 0; i < C.length - 1; i += 2) dash.push([[C[i][0], -DEPTH + 0.01, C[i][1]], [C[i + 1][0], -DEPTH + 0.01, C[i + 1][1]]])
  seg(dash, true)

  // ── right retaining wall with a garage opening for each villa: wall pieces between the openings, a dark recess
  //    behind each opening, a car parked in some of them
  const GW = 3.0, GH = 2.4, PITCH = 8.4, RL = lens(R)
  let cursor = 0
  for (let s = 2.2, i = 0; s < RL; s += PITCH, i++) {
    const a = along(R, cursor), b = along(R, s); if (!a || !b) break
    const piece = (p, q, y0, h, d) => { const L2 = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L2 < 0.05) return; box((p[0] + q[0]) / 2 + d / 2, y0 + h / 2, (p[1] + q[1]) / 2, d, h, L2, { ry: Math.atan2(q[0] - p[0], q[1] - p[1]) }) }
    piece(a[0], b[0], -DEPTH, DEPTH, 0.4)
    const e = along(R, s + GW); if (!e) break
    piece(b[0], e[0], -DEPTH + GH, DEPTH - GH, 0.4)                                                    // lintel over the opening
    const [[gx, gz]] = b, [[hx, hz]] = e
    box((gx + hx) / 2 + 3.2, -DEPTH + GH / 2, (gz + hz) / 2, 6, GH, GW, { a: 0.22, edges: false })      // the dark garage
    if (i % 3 === 1) k.car((gx + hx) / 2 + 2.6, (gz + hz) / 2, Math.PI, -DEPTH)
    cursor = s + GW
  }
  // a solid white wall along the top of the right bank, stopped where the bridge lands
  const onDeck = (x, z) => inPoly(DECK, x - 0.3, z) || inPoly(DECK, x + 0.3, z)
  const P0 = offset(R, 0), P1 = offset(R, -0.45)
  let run = []
  const flush = () => { if (run.length > 1) slabShape([...run.map((i) => P0[i]), ...run.map((i) => P1[i]).reverse()], 0, WALL); run = [] }
  P0.forEach((p, i) => { if (onDeck(p[0], p[1])) flush(); else run.push(i) }); flush()

  // ── right walk: long grey paving planks, then the planter with its hedge, then the villas
  const walk = []
  for (let d = 0.9; d < 4.2; d += 0.62) { const pts = offset(R, -0.45 - d); for (let i = 0; i < pts.length - 1; i++) if ((i + Math.round(d * 7)) % 3) walk.push([[pts[i][0], 0.005, pts[i][1]], [pts[i + 1][0], 0.005, pts[i + 1][1]]]) }
  seg(walk, 'hair')
  const W0 = -4.6, W1 = -6.4                                                    // planter between the walk and the villas
  slabShape([...offset(R, W0), ...offset(R, W1).reverse()], 0, 0.45)
  slabShape([...offset(R, W0 - 0.15), ...offset(R, W1 + 0.15).reverse()], 0.45, 0.55, true, 0.5)   // the hedge in it
  for (let s = 0, i = 0; s < RL; s += PITCH, i++) {
    const a = along(offset(R, W1 - 2.0), s + 4.2); if (!a) break
    if (a[0][1] > 30) continue
    villa(k, a[0], a[1], 1)
  }

  // ── left side: the planter by the road edge (rounded corner, a step in it), the island with a tree, the wide walk
  //    in planks, the villas on the far side of it
  const PL = smoothLoop([[-10.9, -3.2], [-11.4, 0.2], [-11.39, 3.49], [-11.1, 5.2], [-9.6, 6.1], [-9.05, 6.9], [-8.7, 13.2], [-7.1, 13.2], [-6.95, 5.06], [-7.6, -1.8]], 4)
  slabShape(PL, 0, 0.5); loop(PL.map(([x, z]) => [x + (x < -9 ? 0.25 : -0.25), z]), 0.5, true)
  const IS = smoothLoop([[-13.45, -36.9], [-12.19, -20], [-10.71, -16], [-8.33, -14.74], [-8.09, -34]], 5)
  slabShape(IS, 0, 0.5)
  k.tree(-10.6, -24, 8.5, 3, 5)
  const WL = smoothLine([[-12.4, 14], [-12.46, 9.47], [-15.46, -1.87], [-16.97, -20.49], [-21.2, -62.8], [-30, -90], [-44, -118]], 6)
  const WR = smoothLine([[-11.4, 14], [-11.5, 3.6], [-11.59, 0.2], [-12.56, -14.48], [-15.05, -59.5], [-23, -87], [-37, -114]], 6)
  line(WL, 0.005); line(WR, 0.005, true)
  const pk = []
  for (let f = 0.2; f < 1; f += 0.2) { const pts = WL.map((p, i) => [p[0] + (WR[Math.min(i, WR.length - 1)][0] - p[0]) * f, p[1] + (WR[Math.min(i, WR.length - 1)][1] - p[1]) * f]); for (let i = 0; i < pts.length - 1; i++) pk.push([[pts[i][0], 0.005, pts[i][1]], [pts[i + 1][0], 0.005, pts[i + 1][1]]]) }
  seg(pk, 'hair')
  // the narrow gap between the left planter and the road wall, down to the road, near the camera
  slabShape([[-6.9, 13.5], [-6.6, 5.1], [-5.9, 5.1], [-5.9, 13.5]], -DEPTH, DEPTH - 0.05, true, 0.25)
  // planters along the far side of the left walk, and the villas behind them
  slabShape([...offset(WL, -0.1), ...offset(WL, 1.3).reverse()], 0, 0.6, true, 0.5)
  for (let s = 6, i = 0; s < lens(WL); s += PITCH, i++) {
    const a = along(offset(WL, 3.8), s); if (!a) break
    villa(k, a[0], a[1], -1)
  }

  // ── the bridge
  slabShape(DECK, -0.85, 1.0, false)                                         // a thick white slab, top at 0.15
  const fence = (pts, y0, wallH) => {
    const out = [], rails = []
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], d = Math.hypot(bx - ax, bz - az)
      if (wallH) box((ax + bx) / 2, 0.15 + wallH / 2, (az + bz) / 2, 0.24, wallH, d + 0.02, { ry: Math.atan2(bx - ax, bz - az) })
      rails.push([[ax, 1.25, az], [bx, 1.25, bz]], [[ax, 1.18, az], [bx, 1.18, bz]])
      for (let t = 0.07; t < d; t += 0.13) out.push([[ax + ((bx - ax) * t) / d, y0, az + ((bz - az) * t) / d], [ax + ((bx - ax) * t) / d, 1.25, az + ((bz - az) * t) / d]])
    }
    seg(rails); seg(out, 'soft')                                            // the bars read as a white screen in the render: soft, not hair
  }
  fence(NEAR, 0.15, 0)
  fence(FAR, 0.75, 0.6)
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16).translate(FAR[0][0], 0.45, FAR[0][1]), { angle: 40 })   // the rounded end
  // paving: diagonal strips on the bridge, a grid of slabs on the lane at its left end
  const pav = [], dir = [0.83, 0.56]
  for (let o = -30; o < 30; o += 0.62) {
    const pts = []
    for (let t = -30; t <= 30; t += 0.25) { const x = -2 + dir[0] * t - dir[1] * o, z = 4 + dir[1] * t + dir[0] * o; if (inPoly(DECK, x, z) && z > -3) pts.push([x, 0.155, z]) }
    for (let i = 0; i < pts.length - 1; i++) if (Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][2] - pts[i][2]) < 0.3) pav.push([pts[i], pts[i + 1]])
  }
  for (let z = -14; z < -3; z += 0.9) { const xs = []; for (let x = -13; x < -7; x += 0.1) if (inPoly(DECK, x, z)) xs.push(x); if (xs.length > 1) pav.push([[xs[0], 0.155, z], [xs.at(-1), 0.155, z]]) }
  seg(pav, 'hair')

  // ── cars on the road: the blue one under the bridge, the gold one further along
  k.car(1.0, 12, 0, -DEPTH)
  k.car(-1.37, -31.5, 0.05, -DEPTH)
  return VIEW
}

// ── one Courtyard Villa as seen from the walk (from the render): a thick white door portal standing out to the walk,
//    behind it an open white frame with a timber-slat roof and timber screens inside, a terrace on the ground floor
//    roof, an upper white volume with an angled timber louvre window and a small dark window, a set-back volume
//    beside it with a tall dark slot between them. o: point on the house front line; t: direction along the row;
//    side: +1 on the right bank (facing −x), −1 on the left bank.
function villa(k, o, t, side) {
  const [tx, tz] = t, nr = [tz * side, -tx * side]                            // towards the walk
  const P = (u, w) => [o[0] + tx * u + nr[0] * w, o[1] + tz * u + nr[1] * w]
  const ry = Math.atan2(-tz, tx)
  const B = (u0, u1, w0, w1, y0, y1, opt = {}) => { const [x, z] = P((u0 + u1) / 2, (w0 + w1) / 2); k.box(x, (y0 + y1) / 2, z, u1 - u0, y1 - y0, Math.abs(w1 - w0), { ...opt, ry }) }
  const S = (pairs, soft) => k.seg(pairs.map(([[u0, y0, w0], [u1, y1, w1]]) => { const [a, b] = P(u0, w0), [c, d] = P(u1, w1); return [[a, y0, b], [c, y1, d]] }), soft)
  // ground floor block and its roof terrace
  B(0.05, 8.35, -9, -2.4, 0, 5.0)
  B(3.2, 8.35, -2.6, -2.35, 5.0, 5.5)                                         // terrace parapet
  for (let w = -2.7; w > -5; w -= 0.22) S([[[3.4, 5.02, w], [8.2, 5.02, w]]], 'hair')   // timber grating on the terrace
  // the open frame with a timber-slat roof, timber screens inside
  B(0.3, 0.6, -2.4, -0.2, 0, 3.6); B(5.6, 5.9, -2.4, -0.2, 0, 3.6); B(0.3, 5.9, -2.4, -0.2, 3.6, 3.9)
  for (let w = -0.35; w > -2.3; w -= 0.17) S([[[0.6, 3.91, w], [5.6, 3.91, w]]], true)
  for (const [u0, u1] of [[0.7, 1.5], [4.2, 5.4]]) { B(u0, u1, -2.3, -2.25, 0, 3.5, { a: 0.72, soft: true }); for (let u = u0 + 0.1; u < u1; u += 0.13) S([[[u, 0.05, -2.2], [u, 3.45, -2.2]]], 'hair') }
  // the door portal: a thick white frame out to the walk, a dark door in it
  B(1.6, 1.95, -0.2, 2.0, 0, 3.0, { line: 'heavy' }); B(3.65, 4.0, -0.2, 2.0, 0, 3.0); B(1.6, 4.0, -0.2, 2.0, 3.0, 3.35)
  B(1.95, 3.65, -0.25, -0.2, 0, 2.7, { a: 0.2 })
  // upper volume, louvre window, small dark window; set-back volume, dark slot
  B(2.6, 8.4, -11, -3.4, 5.0, 10.6)
  const lu0 = 5.4, lu1 = 7.4, ly0 = 7.0, ly1 = 9.0
  for (let y = ly0; y < ly1; y += 0.19) B(lu0, lu1, -3.45, -3.1, y, y + 0.05, { a: 0.7, soft: true })
  S([[[lu0, ly0, -3.4], [lu0, ly1, -3.4]], [[lu1, ly0, -3.4], [lu1, ly1, -3.4]]])
  B(7.6, 8.2, -3.42, -3.38, 7.9, 8.4, { a: 0.1, edges: false })
  B(0, 2.6, -12, -5.6, 5.0, 10.2)
  B(2.2, 2.6, -5.6, -3.4, 5.0, 10.8, { a: 0.14 })
  B(0.5, 0.9, -5.62, -5.58, 6.4, 7.2, { a: 0.14, edges: false }); B(1.4, 1.8, -5.62, -5.58, 6.4, 7.2, { a: 0.14, edges: false })
}
