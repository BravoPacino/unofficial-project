// Courtyard Villas：照效果图画。沿着泳池一长排，一个单元一个单元重复：
// 一整片白边框的竖木格栅（三楼到屋顶）、旁边一个往外挑的白色方框（里面木内衬 + 窗）、再上面一层凹阳台（黑栏杆）；
// 底层玻璃，每户门口一个白色门框，木百叶小窗；前面一个自由曲线的泳池和小岛。米数是按图估的。
/** 一排 Courtyard Villas：从 x = ox 开始 n 个单元，正面朝 +z（在 z = oz），ry 转向。别的图（泳池、鸟瞰、健身房窗外）也用 */
export function villaRow(k, { n = 7, ox = 0, oz = 0, ry = 0, ground = true, yard = false } = {}) {
  const { box: box0, seg: seg0 } = k
  // 局部坐标 → 世界：先绕 y 转 ry，再平移到 (ox, oz)
  const cs = Math.cos(ry), sn = Math.sin(ry)
  const T = (x, y, z) => [ox + x * cs + z * sn, y, oz - x * sn + z * cs]
  const box = (x, y, z, w, h, d, o = {}) => { const [X, , Z] = T(x, y, z); box0(X, y, Z, w, h, d, { ...o, ry: ry + (o.ry || 0) }) }
  const seg = (pairs, soft) => seg0(pairs.map(([p, q]) => [T(...p), T(...q)]), soft)
  const N = n, PITCH = 9.6, X1 = N * PITCH, G = 3.4, B = 3.75, TOP = 13.6
  const rect = (x0, y0, x1, y1, z, soft = true) => seg([[[x0, y0, z], [x1, y0, z]], [[x1, y0, z], [x1, y1, z]], [[x1, y1, z], [x0, y1, z]], [[x0, y1, z], [x0, y0, z]]], soft)

  if (ground) k.groundPlane()

  // ── 整排的底：底层、腰线、上面三层的墙体（往里退 0.8 m）、屋顶女儿墙
  box(X1 / 2, G / 2, -6, X1, G, 12)
  box(X1 / 2, (G + B) / 2, 0.15, X1 + 0.4, B - G, 0.3)
  box(X1 / 2, (B + TOP) / 2, -0.8 - 5.5, X1, TOP - B, 11)
  box(X1 / 2, TOP + 0.25, -0.95, X1 + 0.2, 0.5, 0.3)

  for (let m = 0; m < N; m++) {
    const x = m * PITCH
    // 底层：玻璃、白色门框（往前凸）、一小片木百叶
    rect(x + 3.0, 0.1, x + 7.8, G - 0.3, 0.02, false)
    for (let u = x + 4.2; u < x + 7.8; u += 1.2) seg([[[u, 0.1, 0.02], [u, G - 0.3, 0.02]]])
    box(x + 1.0, 1.5, 0.45, 0.28, 3.0, 0.9); box(x + 2.5, 1.5, 0.45, 0.28, 3.0, 0.9); box(x + 1.75, 3.0 - 0.14, 0.45, 1.78, 0.28, 0.9)
    rect(x + 1.15, 0.1, x + 2.35, 2.72, 0.05, true)
    for (let u = x + 1.3; u < x + 2.3; u += 0.12) seg([[[u, 0.15, 0.06], [u, 2.6, 0.06]]], true)
    box(x + 1.75, 0.1, 1.3, 1.9, 0.2, 0.8, { soft: true })                        // 台阶
    rect(x + 8.2, 0.6, x + 9.2, 2.7, 0.02, false)
    for (let y = 0.75; y < 2.6; y += 0.13) seg([[[x + 8.2, y, 0.02], [x + 9.2, y, 0.02]]], true)
    // 二楼：玻璃 + 一条窄木格
    rect(x + 1.2, B + 0.15, x + 5.0, B + 2.55, -0.78, false)
    for (let u = x + 2.2; u < x + 5; u += 1.0) seg([[[u, B + 0.15, -0.78], [u, B + 2.55, -0.78]]], true)
    for (let u = x + 0.3; u < x + 1.0; u += 0.12) seg([[[u, B + 0.1, -0.7], [u, B + 2.9, -0.7]]], true)
    // 往外挑的白色方框（三楼）：框料 + 里面的窗、木内衬（左边内侧竖线）、下沿一块挑出的台
    const c0 = x + 1.1, c1 = x + 5.1, cy0 = 6.7, cy1 = 10.1, cz = 0.7, t = 0.3
    const fr = (a0, a1, b0, b1) => box((a0 + a1) / 2, (b0 + b1) / 2, (cz - 0.8) / 2, a1 - a0, b1 - b0, cz + 0.8)
    fr(c0, c0 + t, cy0, cy1); fr(c1 - t, c1, cy0, cy1); fr(c0, c1, cy1 - t, cy1); fr(c0 - 0.2, c1 + 0.2, cy0, cy0 + t)
    rect(c0 + t + 0.15, cy0 + t + 0.1, c1 - t - 0.15, cy1 - t - 0.1, -0.78, false)
    seg([[[(c0 + c1) / 2, cy0 + t + 0.1, -0.78], [(c0 + c1) / 2, cy1 - t - 0.1, -0.78]]], true)
    for (let zz = -0.7; zz < cz - 0.1; zz += 0.18) seg([[[c0 + t + 0.01, cy0 + t, zz], [c0 + t + 0.01, cy1 - t, zz]]], true)
    // 顶层：凹阳台的黑栏杆
    seg([[[c0, 10.6 + 1.05, -0.4], [c1, 10.6 + 1.05, -0.4]], [[c0, 10.7, -0.4], [c1, 10.7, -0.4]]])
    for (let u = c0 + 0.1; u < c1; u += 0.14) seg([[[u, 10.7, -0.4], [u, 11.65, -0.4]]], true)
    rect(c0 + 0.4, 10.6, c1 - 0.4, 13.2, -0.78, true)
    // 一整片白边框的竖木格栅：三楼到屋顶，比女儿墙高一点
    const p0 = x + 5.6, p1 = x + 9.2, py0 = 6.2, py1 = 14.6, pz = 0.4, pt = 0.25
    const pf = (a0, a1, b0, b1) => box((a0 + a1) / 2, (b0 + b1) / 2, (pz - 0.8) / 2, a1 - a0, b1 - b0, pz + 0.8)
    pf(p0, p0 + pt, py0, py1); pf(p1 - pt, p1, py0, py1); pf(p0, p1, py1 - pt, py1); pf(p0, p1, py0, py0 + pt)
    for (let u = p0 + pt + 0.08; u < p1 - pt - 0.04; u += 0.15) box(u, (py0 + py1) / 2, pz - 0.3, 0.05, py1 - py0 - 2 * pt, 0.16, { soft: true, a: 0.4 })   // dark timber fins (a: ink tone)
    // 前院（泳池那边看得到）：门框两边一道矮石墙 + 墙前一条花槽
    if (yard) {
      box(x + 0.35, 0.5, 1.6, 0.7, 1.0, 0.3); box(x + 6.0, 0.5, 1.6, 6.4, 1.0, 0.3)
      box(x + 6.0, 0.25, 2.3, 6.4, 0.5, 1.1, { soft: true })
    }
  }
  return { x1: X1 }
}

export default function villas(k) {
  const { tree, smoothLoop, loop, slabShape } = k
  villaRow(k)
  // ── 前面的泳池：自由曲线，池边一圈 + 里面一圈；中间一个种满植物的岛；走道边线
  const pool = smoothLoop([[-6, 4], [10, 3.6], [24, 5], [38, 4.4], [52, 6], [62, 9], [58, 15], [40, 13], [26, 17], [12, 15], [0, 18], [-10, 13]])
  loop(pool, 0.02); loop(pool.map(([x, z]) => [x + (x - 26) * -0.012, z + (z - 10) * -0.06]), 0.02, true)
  const island = smoothLoop([[18, 9], [28, 8], [36, 9.5], [30, 12], [21, 11.5]])
  slabShape(island, 0, 0.45, true)
  for (const [tx, tz, h, r] of [[24, 10, 7, 2.2], [31, 10.2, 6.2, 1.9]]) tree(tx, tz, h, r, tx)
  tree(-7, 9, 7.5, 2.2, 2); tree(46, 2.8, 7.5, 2.2, 9)
  return { eye: [-16, 2.6, 36], at: [27, 7.4, -3], fov: 32 }
}
