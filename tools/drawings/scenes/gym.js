// Floating gym：照效果图画。玻璃亭子，人站在里面往外看：正面一整面落地玻璃（细竖梃 + 一道横档），
// 两根圆柱；两侧玻璃墙外面一排很深的竖木片，下半截黑框窗；顶棚一圈灯槽；三台跑步机一台单车对着玻璃。
// 外面：一条长泳池、两边木格栅凉亭、两排 Courtyard Villas、尽头一棵开花的树。米数是按图估的。
import { villaRow } from './villas.js'

/** 玻璃亭子：局部坐标正面在 z = 0 朝 +z，进深到 z = -D；放到 (ox, oz) 转 ry */
export function pavilion(k, { ox = 0, oz = 0, ry = 0, W = 7.2, D = 10, H = 5, eye } = {}) {
  const p = k.place(ox, oz, ry), { box, seg, T } = p
  const X0 = -W / 2, X1 = W / 2, TR = 2.5
  box(0, 0.12, -D / 2, W + 0.6, 0.24, D + 0.6)                     // 地台
  box(0, H + 0.3, -D / 2, W + 1.4, 0.6, D + 1.4)                    // 屋顶板
  box(0, H / 2, -D + 0.15, W, H, 0.3)                               // 后墙
  // 正面：细竖梃 + 横档
  const front = []
  for (let u = X0; u <= X1 + 0.01; u += W / 6) front.push([[u, 0.24, 0], [u, H, 0]])
  seg(front)
  box(0, TR, 0, W, 0.16, 0.16)
  // 两侧：玻璃 + 外面深竖木片 + 下半截黑框窗
  for (const [sx, s] of [[X0, -1], [X1, 1]]) {
    const n = Math.round(D / 1.25)
    for (let i = 0; i <= n; i++) {
      const z = -i * (D / n)
      box(sx + s * 0.28, H / 2, z, 0.5, H, 0.1, { soft: true })
      if (i < n) {
        const za = z - 0.08, zb = z - D / n + 0.08
        seg([[[sx, 0.9, za], [sx, 0.9, zb]], [[sx, TR, za], [sx, TR, zb]], [[sx, 1.7, za], [sx, 1.7, zb]], [[sx, 0.9, za], [sx, TR, za]], [[sx, 0.9, zb], [sx, TR, zb]]], true)
      }
    }
    seg([[[sx, TR, 0], [sx, TR, -D]], [[sx, 0.24, 0], [sx, 0.24, -D]], [[sx, H, 0], [sx, H, -D]]])
  }
  // 顶棚灯槽：两圈
  for (const ins of [0.6, 0.85]) {
    const a = X0 + ins, b = X1 - ins, c = -ins, d = -D + ins, y = H - 0.01
    seg([[[a, y, c], [b, y, c]], [[b, y, c], [b, y, d]], [[b, y, d], [a, y, d]], [[a, y, d], [a, y, c]]], ins > 0.7)
  }
  // 两根圆柱（靠正面玻璃）
  if (eye) for (const cx of [X0 + 0.7, X1 - 0.7]) { const [x, , z] = T(cx, 0, -0.8); k.column(x, z, 0.16, 0.24, H, eye) }
  return p
}

/** 跑步机：人朝 -z（控制台在 -z 那头） */
export function treadmill(k, x, z, ry = 0, oy = 0.24) {
  const { box, seg, geo } = k.place(x, z, ry, oy)
  const pr = (pts, px, t, soft) => k.mesh(geo(k.prismX(pts, px, t)), { soft, angle: 25 })
  box(0, 0.12, 0.1, 0.84, 0.16, 2.0)                                // 跑台
  for (const s of [-1, 1]) box(s * 0.38, 0.25, 0.15, 0.08, 0.1, 1.8, { soft: true })   // 两边踏边
  seg([[[-0.3, 0.205, 1.05], [-0.3, 0.205, -0.6]], [[0.3, 0.205, 1.05], [0.3, 0.205, -0.6]]], true)   // 跑带
  pr([[-1.0, 0.04], [-0.55, 0.04], [-0.55, 0.3], [-0.72, 0.42], [-1.0, 0.42]], 0, 0.84)              // 前面电机罩
  for (const s of [-1, 1]) {
    // 斜立柱 + 往后伸的扶手（一整片侧面轮廓）
    pr([[-0.98, 0.4], [-0.86, 0.4], [-0.62, 1.06], [-0.1, 1.06], [-0.1, 1.13], [-0.7, 1.18]], s * 0.43, 0.06)
  }
  pr([[-0.86, 1.08], [-0.52, 1.08], [-0.56, 1.2], [-0.84, 1.3]], 0, 0.92)                          // 控制台（斜面）
  pr([[-0.84, 1.3], [-0.79, 1.3], [-0.9, 1.66], [-0.95, 1.66]], 0, 0.5)                            // 屏（往后仰）
}

/** 单车（立式）：人朝 -z */
export function bike(k, x, z, ry = 0, oy = 0.24) {
  const { box, geo } = k.place(x, z, ry, oy)
  const pr = (pts, t, soft) => k.mesh(geo(k.prismX(pts, 0, t)), { soft, angle: 25 })
  box(0, 0.04, 0.5, 0.55, 0.08, 0.1); box(0, 0.04, -0.55, 0.55, 0.08, 0.1); box(0, 0.09, 0, 0.1, 0.1, 1.1)   // 脚架
  const fw = new k.THREE.CylinderGeometry(0.33, 0.33, 0.14, 24).rotateZ(Math.PI / 2).translate(0, 0.46, -0.22)
  k.mesh(geo(fw), { angle: 30 })                                                                    // 飞轮罩
  pr([[0.16, 0.12], [0.28, 0.12], [0.36, 0.96], [0.26, 0.96]], 0.07)                                // 座管
  pr([[-0.2, 0.5], [0.22, 0.38], [0.27, 0.48], [-0.18, 0.62]], 0.07)                                // 横梁
  pr([[-0.52, 0.1], [-0.42, 0.1], [-0.44, 1.12], [-0.54, 1.12]], 0.07)                              // 把立
  box(0, 1.0, 0.33, 0.24, 0.08, 0.3)                                                                // 座
  box(0, 1.24, -0.52, 0.32, 0.2, 0.06)                                                              // 表
  box(0, 1.1, -0.44, 0.52, 0.045, 0.045)
  for (const s of [-1, 1]) box(s * 0.24, 1.08, -0.3, 0.045, 0.045, 0.3)                            // 把手
}

/** 木格栅凉亭 + 下面一张躺椅（泳池边） */
export function cabana(k, x, z, ry = 0) {
  const { box } = k.place(x, z, ry)
  const w = 2.6, d = 2.8, h = 2.7
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(a * (w / 2 - 0.12), h / 2, b * (d / 2 - 0.12), 0.24, h, 0.24)
  for (const a of [-1, 1]) box(a * (w / 2 - 0.12), h + 0.12, 0, 0.24, 0.24, d + 0.4)
  for (let u = -d / 2; u <= d / 2 + 0.01; u += 0.28) box(0, h + 0.3, u, w + 0.3, 0.12, 0.1, { soft: true })
  box(0, 0.22, 0.2, 0.75, 0.22, 1.9, { soft: true })
  box(0, 0.5, -0.65, 0.75, 0.5, 0.12, { soft: true, ry: 0 })
}

export default function gym(k) {
  const { tree, bush, smoothLoop, loop } = k
  const eye = [0.3, 1.72, 9.4]
  k.groundPlane()
  // 亭子正面朝 -z（在 z = 0），人在里面
  pavilion(k, { ox: 0, oz: 0, ry: Math.PI, W: 7.2, D: 10, H: 5, eye })
  for (const x of [-1.85, -0.6, 0.65]) treadmill(k, x, 3.3)
  bike(k, 2.25, 3.7, 0.35)
  // 外面：两排别墅面对面
  villaRow(k, { n: 7, ox: 12, oz: -58, ry: -Math.PI / 2, ground: false, yard: true })
  villaRow(k, { n: 7, ox: -12, oz: 10, ry: Math.PI / 2, ground: false, yard: true })
  // 长泳池：从亭子前面一直往里，尽头往左拐一点
  const pool = smoothLoop([[-4.4, -1.5], [4.6, -1.5], [4.4, -16], [3.8, -30], [3.2, -42], [0.5, -52], [-4, -56], [-6, -50], [-3.6, -40], [-3.8, -26], [-4.3, -12]], 6)
  loop(pool, 0.02); loop(pool.map(([x, z]) => [x * 0.9, z * 0.99 - 0.1]), 0.02, true)
  // 两边凉亭（一边两个）、尽头那棵开花的树、两边树和灌木
  for (const z of [-7, -15]) { cabana(k, -5.6, z, Math.PI / 2); cabana(k, 5.8, z, -Math.PI / 2) }
  tree(-0.6, -36, 9.5, 4.6, 3)
  for (const [x, z, h, r, s] of [[-8.2, -4, 10, 2.4, 4], [8.4, -6, 10, 2.4, 5], [-8, -22, 11, 2.6, 6], [8.2, -24, 11, 2.6, 7], [-7.6, -40, 10, 2.4, 8], [7.8, -40, 10, 2.4, 9]]) tree(x, z, h, r, s)
  for (const [x, z, r] of [[-8, -10, 0.9], [-7.6, -12, 0.7], [8, -11, 0.9], [7.6, -13, 0.7], [-7, -30, 1], [7, -32, 1]]) bush(x, z, r, x + z)
  return { eye, at: [0.3, 2.3, -10], fov: 46 }
}
