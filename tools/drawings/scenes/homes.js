// Courtyard Homes：照效果图的立面画（底层落地玻璃 + 中间白墩、底层顶上一道往外挑的横木百叶檐；
// 二三层一个白色粗框，框里上下两个凹阳台：左右横百叶推拉门、中间玻璃门、前面黑色竖条栏杆；
// 框右边一整片竖木格栅；旁边深蓝色体块开小竖窗，后面一块更高的深蓝体块是第四层）。米数是按图估的。
export default function homes(k) {
  const { box, seg, tree } = k
  const G = 3.6, PITCH = 15.5, xs = [0, PITCH, 2 * PITCH, 3 * PITCH]

  const ground = new k.THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2)
  k.scene.add(new k.THREE.Mesh(ground, new k.THREE.MeshBasicMaterial({ color: k.P.face, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 })))
  // 街：路沿、人行道
  seg([[[-40, 0, 7.2], [90, 0, 7.2]], [[-40, 0, 7.5], [90, 0, 7.5]], [[-40, 0, 10], [90, 0, 10]]])

  // 深色材料：正面上加 45° 细斜线（z 平面 / x 平面各一个）
  const hatchZ = (x0, y0, x1, y1, z, gap = 0.45) => {
    const out = []
    for (let c = x0 - (y1 - y0); c < x1; c += gap) {
      let ax = c, ay = y0, bx = c + (y1 - y0), by = y1
      if (ax < x0) { ay += x0 - ax; ax = x0 }
      if (bx > x1) { by -= bx - x1; bx = x1 }
      if (by > ay) out.push([[ax, ay, z], [bx, by, z]])
    }
    seg(out, true)
  }
  const hatchX = (z0, y0, z1, y1, x, gap = 0.45) => {
    const out = []
    for (let c = z0 - (y1 - y0); c < z1; c += gap) {
      let az = c, ay = y0, bz = c + (y1 - y0), by = y1
      if (az < z0) { ay += z0 - az; az = z0 }
      if (bz > z1) { by -= bz - z1; bz = z1 }
      if (by > ay) out.push([[x, ay, az], [x, by, bz]])
    }
    seg(out, true)
  }
  const rect = (x0, y0, x1, y1, z, soft = true) => seg([[[x0, y0, z], [x1, y0, z]], [[x1, y0, z], [x1, y1, z]], [[x1, y1, z], [x0, y1, z]], [[x0, y1, z], [x0, y0, z]]], soft)

  for (const [i, x0] of xs.entries()) {
    const L = x0 - 6, R = x0 + 6
    // ── 底层：整栋最宽，前面整面玻璃，中间一根白墩
    box(x0, G / 2, -7, 12, G, 14)
    const gz = 0.02
    rect(L + 0.5, 0.1, L + 4.7, G - 0.35, gz, false)
    rect(L + 6.3, 0.1, R - 0.9, G - 0.35, gz, false)
    for (let u = L + 1.55; u < L + 4.6; u += 1.05) seg([[[u, 0.1, gz], [u, G - 0.35, gz]]], true)
    for (let u = L + 7.35; u < R - 1; u += 1.05) seg([[[u, 0.1, gz], [u, G - 0.35, gz]]], true)
    seg([[[L + 0.5, 2.55, gz], [L + 4.7, 2.55, gz]], [[L + 6.3, 2.55, gz], [R - 0.9, 2.55, gz]]], true)
    box(x0, 0.08, 1.4, 12, 0.16, 2.8, { soft: true })                          // 木平台
    // ── 一楼顶：白色楼板边往外挑，板边往下挂一排横木条（挡住门框上沿），右头往里折回
    const CX0 = L + 0.3, CX1 = R + 0.4, CZ = 1.12
    box((CX0 + CX1) / 2, G + 0.15, 0.3, CX1 - CX0, 0.3, 1.7)
    for (let s = 0; s < 8; s++) {
      const y = G - 0.1 - s * 0.15
      box((CX0 + CX1) / 2, y, CZ, CX1 - CX0, 0.05, 0.07, { soft: true })
      box(CX1, y, (CZ - 1.0) / 2, 0.07, 0.05, CZ + 1.0, { soft: true })
    }
    for (let u = CX0 + 0.05; u < CX1; u += 1.45) box(u, G - 0.6, CZ + 0.05, 0.05, 1.2, 0.04)
    // ── 二三层：白框（框料往前、阳台往里凹 1.2 m）
    const FX0 = L + 0.6, FX1 = FX0 + 7.7, Y0 = G + 0.3, Y1 = Y0 + 6.7, t = 0.38, dz = 1.2
    // 深蓝窄塔（两扇小窗）在框右边隔一道凹进去的墙；整栋上面最高到框顶
    const TX0 = FX1 + 0.9, TX1 = TX0 + 1.3
    box((FX0 + FX1) / 2, (Y0 + Y1) / 2, -dz - 5, FX1 - FX0, Y1 - Y0, 10)       // 框后面的墙体
    box((FX1 + TX0) / 2, (G + Y1 - 0.1) / 2, -1.6 - 4.8, TX0 - FX1, Y1 - 0.1 - G, 9.6)
    box((TX0 + TX1) / 2, (G + Y1 - 0.1) / 2, -0.3 - 5.45, TX1 - TX0, Y1 - 0.1 - G, 10.9)
    const fr = (x0_, x1_, y0_, y1_) => box((x0_ + x1_) / 2, (y0_ + y1_) / 2, -dz / 2, x1_ - x0_, y1_ - y0_, dz)
    const DIV = FX0 + 5.15, MID = Y0 + 3.3
    fr(FX0, FX0 + t, Y0, Y1); fr(FX1 - t, FX1, Y0, Y1); fr(DIV, DIV + t, Y0, Y1)
    fr(FX0, FX1, Y1 - t, Y1); fr(FX0 + t, DIV, MID - t / 2, MID + t / 2)
    for (const [b0, b1] of [[Y0, MID - t / 2], [MID + t / 2, Y1 - t]]) {
      const bx0 = FX0 + t, bx1 = DIV, zb = -dz + 0.02
      // 左右两扇横百叶推拉门（外框 + 横条）、中间玻璃门
      for (const [s0, s1] of [[bx0 + 0.1, bx0 + 1.35], [bx1 - 1.25, bx1 - 0.1]]) {
        rect(s0, b0 + 0.05, s1, b1 - 0.1, zb, false)
        for (let y = b0 + 0.2; y < b1 - 0.15; y += 0.13) seg([[[s0, y, zb], [s1, y, zb]]], true)
      }
      rect(bx0 + 1.5, b0 + 0.05, bx1 - 1.4, b1 - 0.35, zb, true)
      seg([[[(bx0 + bx1) / 2 + 0.05, b0 + 0.05, zb], [(bx0 + bx1) / 2 + 0.05, b1 - 0.35, zb]]], true)
      // 黑色竖条栏杆（靠前）
      const zr = -0.3
      seg([[[bx0, b0 + 1.1, zr], [bx1, b0 + 1.1, zr]], [[bx0, b0 + 0.12, zr], [bx1, b0 + 0.12, zr]]])
      for (let u = bx0 + 0.12; u < bx1; u += 0.14) seg([[[u, b0 + 0.12, zr], [u, b0 + 1.1, zr]]], true)
    }
    // 框右边：一整片竖木格栅
    for (let u = DIV + t + 0.1; u < FX1 - t - 0.05; u += 0.2) box(u, (Y0 + Y1 - t) / 2, -0.55, 0.06, Y1 - t - Y0, 0.24, { soft: true })
    // ── 深蓝窄塔：正面两扇小竖窗，外侧面两扇大窗；凹墙、塔都是深色（斜线）
    const YT = Y1 - 0.1
    for (const wy of [Y0 + 1.1, MID + 1.1]) { k.plate(TX0 + 0.65, wy + 0.575, -0.27, 0.46, 1.15); rect(TX0 + 0.42, wy, TX0 + 0.88, wy + 1.15, -0.265, false) }
    hatchZ(TX0, G + 0.3, TX1, YT, -0.28); hatchX(-11.2, G + 0.3, -0.3, YT, TX1 + 0.01); hatchX(-1.6, G + 0.3, -0.3, YT, TX0 - 0.01)
    hatchZ(FX1, G + 0.3, TX0 - 0.3, YT, -1.58)
    // 框和塔中间一片细白墙：从下到上，顶上比框高出一截（跟邻居隔开的墙头）
    box(TX0 - 0.15, (G + 0.3 + Y1 + 1.2) / 2, -0.2 - 3, 0.3, Y1 + 1.2 - G - 0.3, 6)
    hatchX(-6.2, Y1, -0.2, Y1 + 1.2, TX0 - 0.31, 0.35); hatchX(-6.2, YT, -0.2, Y1 + 1.2, TX0 + 0.01, 0.35)   // 墙头两侧是深色
    // 左上角：框后面一道深色隔墙，比框顶高出一点
    const PX = FX0 + 0.45
    box(PX, (G + Y1 + 0.7) / 2, -1.3 - 5.5, 0.3, Y1 + 0.7 - G, 11)
    hatchX(-12.3, Y1, -1.3, Y1 + 0.7, PX - 0.16, 0.35); hatchZ(PX - 0.15, Y1, PX + 0.15, Y1 + 0.7, -1.28, 0.2)
    // 两边侧墙上的窗：左侧（主体）每层一高一窄；右侧（塔的外侧面）每层一大一小
    const rectX = (z0, y0, z1, y1, x, soft = false) => seg([[[x, y0, z0], [x, y0, z1]], [[x, y0, z1], [x, y1, z1]], [[x, y1, z1], [x, y1, z0]], [[x, y1, z0], [x, y0, z0]]], soft)
    for (const fy of [Y0, MID]) {
      rectX(-4.6, fy + 0.7, -3.6, fy + 2.8, FX0 - 0.01); rectX(-8.4, fy + 1.2, -7.6, fy + 2.6, FX0 - 0.01)
      seg([[[FX0 - 0.01, fy + 1.75, -4.6], [FX0 - 0.01, fy + 1.75, -3.6]]], true)
      k.plate(TX1 + 0.015, fy + 1.65, -3.0, 1.8, 1.7, Math.PI / 2); k.plate(TX1 + 0.015, fy + 1.85, -6.95, 0.7, 1.3, Math.PI / 2)
      rectX(-3.9, fy + 0.8, -2.1, fy + 2.5, TX1 + 0.02); rectX(-7.3, fy + 1.2, -6.6, fy + 2.5, TX1 + 0.02)
      seg([[[TX1 + 0.02, fy + 1.65, -3.9], [TX1 + 0.02, fy + 1.65, -2.1]]], true)
    }
    // ── 前院：草地边、绿篱（中间留口）
    box(x0 - 3.2, 0.4, 5.3, 6.6, 0.8, 0.9, { soft: true }); box(x0 + 4.4, 0.4, 5.3, 5.4, 0.8, 0.9, { soft: true })
    if (i === 0 || i === 2) tree(R + 1.6, 4.6, 7.2, 2.0, 11 + i)
  }
  return { eye: [8, 2.4, 44], at: [22, 6.6, -2], fov: 30 }
}
