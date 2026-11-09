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
  const { box, seg } = k.place(x, z, ry), f = flip ? -1 : 1
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

export default function walkway(k) {
  const { tree, bush, smoothLine, line, slabShape, seg, box } = k
  const eye = [-9, 12, 19], DEPTH = 3.2
  k.groundPlane(-DEPTH)

  // ── 下沉车道：中线、两边挡土墙（左右两大块地面从车道底挤到 0）
  const C = smoothLine([[6.5, 40], [3.5, 14], [0, 0], [-4.5, -14], [-11, -30], [-21, -46], [-34, -60]], 8)
  const LE = offset(C, 4), RE = offset(C, -4)
  // 两岸地面 + 两道挡土墙：沿车道的条带（不三角剖分），边线自己画
  k.ribbon(LE, offset(C, 90), 0, 0); k.ribbon(RE, offset(C, -90), 0, 0)
  k.ribbon(LE, LE, 0, -DEPTH); k.ribbon(RE, RE, 0, -DEPTH)
  // 边线只画到相机前面（穿过相机平面的长线段会被线材质裁成很怪的斜线）
  const front = (pts) => pts.filter(([, z]) => z < eye[2] - 2)
  line(front(LE), 0); line(front(RE), 0); line(front(LE), -DEPTH); line(front(RE), -DEPTH)
  // 车道中线（虚线，软）
  const dash = []
  for (let i = 0; i < C.length - 1; i += 2) dash.push([[C[i][0], -DEPTH + 0.01, C[i][1]], [C[i + 1][0], -DEPTH + 0.01, C[i + 1][1]]])
  seg(dash, true)

  // ── 右边一排房子 + 每户下面一个车库口（在挡土墙上）
  const RH = offset(C, -4 - 4.2), GAR = offset(C, -4 + 0.02)
  for (let s = 6, i = 0; s < 130; s += 10, i++) {
    const a = along(RH, s); if (!a) break
    const [[x, z], [tx, tz]] = a, nx = tz, nz = -tx                         // 朝车道（左法线）
    const ry = Math.atan2(nx, nz)
    if (z > 12 || z < -70) continue
    whiteHouse(k, x, z, ry, false)
    const g = along(GAR, s); if (!g) continue
    const [[gx, gz], [gtx, gtz]] = g, h = 2.4
    const p = [gx - gtx * 1.9, gz - gtz * 1.9], q = [gx + gtx * 1.9, gz + gtz * 1.9]
    seg([[[p[0], -DEPTH, p[1]], [p[0], -DEPTH + h, p[1]]], [[p[0], -DEPTH + h, p[1]], [q[0], -DEPTH + h, q[1]]], [[q[0], -DEPTH + h, q[1]], [q[0], -DEPTH, q[1]]]])
  }
  // 左边远处一排（只看得到一部分）
  const LH = offset(C, 4 + 14)
  for (let s = 20; s < 130; s += 10) {
    const a = along(LH, s); if (!a) break
    const [[x, z], [tx, tz]] = a
    if (z > -8) continue
    whiteHouse(k, x, z, Math.atan2(-tz, tx), true)
  }

  // ── 两岸的花槽（桥落脚的地方断开）+ 左边人行道
  const strip = (pts, d0, d1, keep) => {
    const a = offset(pts, d0), b = offset(pts, d1), runs = []
    let cur = []
    a.forEach((p, i) => { if (keep(p)) cur.push(i); else if (cur.length) { runs.push(cur); cur = [] } })
    if (cur.length) runs.push(cur)
    for (const r of runs) if (r.length > 2) slabShape([...r.map((i) => a[i]), ...r.map((i) => b[i]).reverse()], 0, 0.7, true)
  }
  const offBridge = ([, z]) => z < 0 || z > 19
  strip(C, -4.4, -5.6, offBridge); strip(C, 4.4, 5.8, offBridge)
  line(offset(C, 7.2), 0.01, true); line(offset(C, 10), 0.01, true)
  const pj = [], P1 = offset(C, 7.2), P2 = offset(C, 10)
  for (let i = 0; i < P1.length; i++) pj.push([[P1[i][0], 0.01, P1[i][1]], [P2[i][0], 0.01, P2[i][1]]])
  seg(pj, true)

  // ── 人行桥：斜着跨过车道，桥面 + 两边密竖条栏杆 + 桥面铺地缝
  const A = [-6.4, 3.2], B = [10, 14.6], dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz), W = 4.6
  const ux = dx / L, uz = dz / L, vx = -uz, vz = ux
  box((A[0] + B[0]) / 2, -0.25, (A[1] + B[1]) / 2, L, 0.8, W, { ry: Math.atan2(-dz, dx) })   // 桥面比地面高 0.15
  const rails = [], soft = []
  for (const sgn of [-1, 1]) {
    const ox = vx * sgn * (W / 2 - 0.1), oz = vz * sgn * (W / 2 - 0.1)
    const P = (t, y) => [A[0] + ux * t + ox, y, A[1] + uz * t + oz]
    rails.push([P(0, 1.25), P(L, 1.25)], [P(0, 0.2), P(L, 0.2)])
    for (let t = 0.1; t < L; t += 0.13) soft.push([P(t, 0.2), P(t, 1.25)])
  }
  for (let t = 0; t < L; t += 0.9) { const a0 = [A[0] + ux * t - vx * W / 2, 0.155, A[1] + uz * t - vz * W / 2], a1 = [A[0] + ux * t + vx * W / 2, 0.155, A[1] + uz * t + vz * W / 2]; soft.push([a0, a1]) }
  seg(rails); seg(soft, true)

  // ── 车：桥下一辆、远处一辆、车库里一辆
  k.car(3.0, 17.5, 0.2, -DEPTH)
  k.car(-2.2, -6, 0.3, -DEPTH)
  // 树
  for (const [x, z, h, r, s] of [[-9, -4, 8.5, 2.8, 1], [-12, -26, 8, 2.4, 2], [12.5, 24, 8, 2.6, 3], [3, -24, 7, 2.2, 4]]) tree(x, z, h, r, s)
  for (const [x, z, r] of [[-7.6, 22, 1.4], [-6.4, 18, 1.2], [-8.4, 26, 1.6]]) bush(x, z, r, x * z)
  return { eye, at: [0.5, -1.5, -10], fov: 44 }
}
