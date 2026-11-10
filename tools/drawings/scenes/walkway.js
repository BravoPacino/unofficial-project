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

/** 白色方盒子房子：局部正面在 z = 0 朝 +z，宽 8.4 */
function whiteHouse(k, x, z, ry, flip = false) {
  // heights 1.2× the first tracing: against the render the houses stand that much taller over their door portals
  const pl = k.place(x, z, ry), f = flip ? -1 : 1, Y = 1.2
  const box = (bx, by, bz, w, h, d, o) => pl.box(bx, by * Y, bz, w, h * Y, d, o)
  const seg = (pairs, soft) => pl.seg(pairs.map(([p, q]) => [[p[0], p[1] * Y, p[2]], [q[0], q[1] * Y, q[2]]]), soft)
  const rect = (x0, y0, x1, y1, zz, soft = false) => seg([[[x0, y0, zz], [x1, y0, zz]], [[x1, y0, zz], [x1, y1, zz]], [[x1, y1, zz], [x0, y1, zz]], [[x0, y1, zz], [x0, y0, zz]]], soft)
  box(0, 3.3, -6.5, 8.4, 6.6, 13)                                            // 两层主体
  box(-f * 1.2, 7.9, -8.5, 6, 2.6, 8)                                       // 三楼往后退
  box(f * 1.6, 5.0, 0.7, 4.6, 3.0, 1.4)                                     // 二楼往前凸的盒子
  // 凸盒子上的木百叶窗
  const w0 = f * 1.6 - 1.6, w1 = f * 1.6 + 1.6
  rect(w0, 4.0, w1, 6.0, 1.41)
  for (let y = 4.15; y < 5.95; y += 0.16) seg([[[w0, y, 1.41], [w1, y, 1.41]]], true)
  // 白色厚门框（往前伸）+ 里面的门 + 旁边一片竖木格栅
  const ex = -f * 2.3
  box(ex - 1.15, 1.6, 1.0, 0.45, 3.2, 2.0); box(ex + 1.15, 1.6, 1.0, 0.45, 3.2, 2.0); box(ex, 3.4, 1.0, 2.75, 0.45, 2.0)
  rect(ex - 0.6, 0.0, ex + 0.6, 2.6, 0.02)
  const s0 = ex + f * 1.6, s1 = ex + f * 2.8
  rect(Math.min(s0, s1), 0.2, Math.max(s0, s1), 3.0, 0.03)
  for (let u = Math.min(s0, s1) + 0.12; u < Math.max(s0, s1); u += 0.14) seg([[[u, 0.2, 0.03], [u, 3.0, 0.03]]], true)
  // 屋顶女儿墙、一楼小窗
  box(0, 6.75, -0.15, 8.4, 0.3, 0.3)
  rect(f * 2.0, 0.9, f * 3.6, 2.6, 0.02)
  box(f * 2.2, 0.4, 2.6, 3.8, 0.8, 0.9, { soft: true })                     // 门前花槽
}

// ── 照手册第 10 页（同网站效果图）重画：一条下沉的车道笔直往远处去、远处往左弯；右岸是挡土墙（墙上一户一个车库口）、
// 墙顶一道白色实墙、一条铺地人行道、一排花槽、一排白房子；左岸是车道边一道矮白墙 + 花槽、宽的铺地人行道、再过去另一排房子。
// 人行桥从左岸人行道斜着跨过车道，落在右岸、房子前的人行道上。米数按图估，镜头对着效果图调。
// fitted to the render (lines through the road's vanishing point, the bridge's two parapets): see tools/ink/fitw notes in the commit
const DEPTH = 3.2, HALF = 5.6, WALL = 1.3, PORTAL = 4.5
// the bridge: left end on the left-bank walk, right end on the walk in front of the houses (x across the road, z along it)
export const BRIDGE = { A: [-8.15, -8.4], B: [3.56, 11.3], W: 3.5 }
export const VIEW = { eye: [-8.2, 8.9, 21.2], at: [7.8, -1.35, -8.6], fov: 51.5 }

export default function walkway(k) {
  const { smoothLine, line, slabShape, seg, box, mesh } = k
  k.groundPlane(-DEPTH)
  // the road's centre line: straight past the bridge, bending left far away (offset > 0 is the left bank)
  const C = smoothLine([[0, 34], [0, 10], [0, -12], [-2.5, -30], [-9, -48], [-20, -64]], 8)
  const LE = offset(C, HALF), RE = offset(C, -HALF)
  k.ribbon(LE, offset(C, 60), 0, 0); k.ribbon(RE, offset(C, -60), 0, 0)
  k.ribbon(LE, LE, 0, -DEPTH); k.ribbon(RE, RE, 0, -DEPTH)
  line(LE, 0); line(RE, 0); line(LE, -DEPTH); line(RE, -DEPTH)
  const strip = (d0, d1, y0, h, o = {}) => slabShape([...offset(C, d0), ...offset(C, d1).reverse()], y0, h, o.soft ?? true)

  // ── right bank: a garage opening per house in the retaining wall, a solid white wall along the top,
  //    the paved walk, a planter, the houses
  const GAR = offset(C, -HALF + 0.02)
  for (let s = 3; s < 110; s += 8.4) {
    const a = along(GAR, s), b = along(GAR, s + 3); if (!a || !b) break
    const [[x0, z0]] = a, [[x1, z1]] = b
    seg([[[x0, -DEPTH, z0], [x0, -DEPTH + 2.4, z0]], [[x0, -DEPTH + 2.4, z0], [x1, -DEPTH + 2.4, z1]], [[x1, -DEPTH + 2.4, z1], [x1, -DEPTH, z1]]])
  }
  const beyond = ([x, z]) => { const { A, B, W } = BRIDGE, dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz); return Math.abs(((x - A[0]) * -dz + (z - A[1]) * dx) / L) > W / 2 }   // the parapet stops where the bridge lands          // the parapet stops where the bridge lands
  const runs = (pts) => { const out = []; let cur = []; pts.forEach((p) => { if (beyond(p)) cur.push(p); else if (cur.length) { out.push(cur); cur = [] } }); if (cur.length) out.push(cur); return out }
  const P0 = offset(C, -HALF), P1 = offset(C, -HALF - 0.45)
  for (const r of runs(P0.map((p, i) => [...p, i]))) {
    const idx = r.map((p) => p[2]); if (idx.length < 2) continue
    slabShape([...idx.map((i) => P0[i]), ...idx.map((i) => P1[i]).reverse()], 0, WALL)
  }
  line(offset(C, -HALF - 3.0), 0.01, true)                                               // walk / planter edge
  strip(-HALF - 3.0, -HALF - PORTAL + 0.1, 0, 0.55)                                      // planter in front of the houses
  const RH = offset(C, -HALF - PORTAL - 2.0)                                              // house fronts: the portals stand 2 m proud
  for (let s = 0, i = 0; s < 120; s += 8.4, i++) {
    const a = along(RH, s); if (!a) break
    const [[x, z], [tx, tz]] = a
    if (z > 40) continue
    whiteHouse(k, x, z, Math.atan2(tz, -tx), i % 2 === 1)               // facing the road
  }

  // ── left bank: a low white wall at the road edge, a planter, the wide paved walk, the other row of houses
  strip(HALF, HALF + 0.3, 0, 0.6, { soft: false })
  strip(HALF + 0.3, HALF + 2.6, 0, 0.5)
  line(offset(C, HALF + 2.6), 0.01, true); line(offset(C, HALF + 8.4), 0.01, true)
  const pj = [], Q1 = offset(C, HALF + 2.6), Q2 = offset(C, HALF + 8.4)
  for (let i = 0; i < Q1.length; i += 2) pj.push([[Q1[i][0], 0.01, Q1[i][1]], [Q2[i][0], 0.01, Q2[i][1]]])
  seg(pj, true)
  const LH = offset(C, HALF + 14.5)
  for (let s = 12; s < 120; s += 8.4) {
    const a = along(LH, s); if (!a) break
    const [[x, z], [tx, tz]] = a
    if (z > 0) continue
    whiteHouse(k, x, z, Math.atan2(-tz, tx), true)
  }

  // ── the bridge, as the render draws it: a thick white deck (about 1 m of white edge shows over the road),
  //    dense white bars along the near edge, a low solid wall with bars on it along the far edge ending in a rounded end
  //    where it lands by the houses, paving laid in long diagonal strips
  // its two ends are cut along the line of the road, as in the render: the far parapet stops (rounded end) at the edge of
  // the right-hand walk while the near edge runs on towards the camera
  const { A, B, W } = BRIDGE, dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz)
  const ux = dx / L, uz = dz / L, vx = -uz, vz = ux
  const XL = -HALF - 4.4, XR = HALF + 0.45                                                     // left walk / right walk
  const side = (sgn, inset = 0) => { const o = sgn * (W / 2 - inset), px = A[0] + vx * o, pz = A[1] + vz * o; return (X) => [X, px === X ? pz : pz + ((X - px) / ux) * uz] }
  const far = side(-1), near = side(1), farIn = side(-1, 0.12), nearIn = side(1, 0.12)
  slabShape([far(XL), far(XR), near(XR), near(XL)], -0.85, 1.0, false)                         // the deck: a thick white slab, top at 0.15
  const wall = [farIn(XL), farIn(XR)], wl = Math.hypot(wall[1][0] - wall[0][0], wall[1][1] - wall[0][1])
  box((wall[0][0] + wall[1][0]) / 2, 0.45, (wall[0][1] + wall[1][1]) / 2, wl, 0.6, 0.24, { ry: Math.atan2(-(wall[1][1] - wall[0][1]), wall[1][0] - wall[0][0]) })
  mesh(new k.THREE.CylinderGeometry(0.12, 0.12, 0.6, 16).translate(wall[1][0], 0.45, wall[1][1]), { angle: 40 })   // the rounded end
  const rails = [], soft = []
  for (const [S, y0] of [[nearIn, 0.15], [farIn, 0.75]]) {
    const [p, q] = [S(XL), S(XR)], len = Math.hypot(q[0] - p[0], q[1] - p[1])
    const at = (t, y) => [p[0] + ((q[0] - p[0]) * t) / len, y, p[1] + ((q[1] - p[1]) * t) / len]
    rails.push([at(0, 1.25), at(len, 1.25)])
    for (let t = 0.1; t < len; t += 0.13) soft.push([at(t, y0), at(t, 1.25)])
  }
  // paving in long diagonal strips, clipped to the deck
  const inDeck = (x, z) => { if (x < XL || x > XR) return false; const o = (x - A[0]) * vx + (z - A[1]) * vz; return Math.abs(o) < W / 2 }
  for (let t = -40; t < 60; t += 0.7) {
    const p = [A[0] + ux * t - vx * W / 2, A[1] + uz * t - vz * W / 2], q = [p[0] + ux * W * 0.9 + vx * W, p[1] + uz * W * 0.9 + vz * W]
    const pts = []; for (let i = 0; i <= 20; i++) { const x = p[0] + ((q[0] - p[0]) * i) / 20, z = p[1] + ((q[1] - p[1]) * i) / 20; if (inDeck(x, z)) pts.push([x, 0.155, z]) }
    if (pts.length > 1) soft.push([pts[0], pts.at(-1)])
  }
  seg(rails); seg(soft, true)

  // ── cars on the road: one under the bridge, one further along
  k.car(1.0, 12, 0, -DEPTH)
  k.car(-1, -14, 0.05, -DEPTH)
  return VIEW
}
