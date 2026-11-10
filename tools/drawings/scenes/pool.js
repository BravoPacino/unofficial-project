// 泳池：照效果图画。人站在池边，顺着院子往里看：两排 Courtyard Villas 面对面，
// 中间一个自由曲线的泳池，三个种满植物的小岛，右边一个圆岛周围一圈喷泉，右下角一个圆的按摩池；
// 两边走道、高树，尽头是玻璃健身亭和一棵开花的树。米数是按图估的。
import { villaRow } from './villas.js'
import { pavilion, treadmill } from './gym.js'

const ell = (cx, cz, rx, rz, n = 7, wob = 0) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2, r = 1 + wob * Math.sin(a * 3 + cx)
  return [cx + Math.cos(a) * rx * r, cz + Math.sin(a) * rz * r]
})

export default function pool(k) {
  const { tree, bush, smoothLoop, smoothLine, loop, line, slabShape, seg } = k
  const eye = [2.6, 1.7, 25]
  k.groundPlane()
  // 两排别墅：右边朝 -x、左边朝 +x，前院矮墙 + 花槽
  villaRow(k, { n: 9, ox: 16, oz: -64, ry: -Math.PI / 2, ground: false, yard: true })
  villaRow(k, { n: 9, ox: -16, oz: 14, ry: Math.PI / 2, ground: false, yard: true })
  // 尽头的健身亭（正面朝这边），里面看得到几台跑步机
  pavilion(k, { ox: -1, oz: -23.5, W: 15, D: 9, H: 7, eye })
  for (const x of [-5, -3.4, -1.8]) treadmill(k, x, -26)

  // ── 泳池：外圈池边 + 里面一圈（软线）
  const P = smoothLoop([[-1.5, 24], [-2.8, 19.5], [-5.4, 15], [-8.6, 11], [-10.8, 6], [-10.5, 1], [-9.5, -6], [-8.5, -12], [-4.5, -16.5], [1, -18], [6, -17.5], [9, -14.5], [8.6, -10.5],
    [6.5, -7.5], [8.5, -3.5], [11, 0.5], [11, 6], [8.4, 9.5], [7, 13], [6, 18.5], [4.5, 23]], 8)
  loop(P, 0.03)
  const cx = 0, cz = 0
  loop(P.map(([x, z]) => [x + (cx - x) * 0.04, z + (cz - z) * 0.025]), 0.03, true)
  // 池中的岛：矮花池（边是一圈石沿），上面灌木
  const islands = [ell(-6, -10, 2.6, 1.7, 8, 0.12), ell(-0.3, -13, 1.9, 1.5, 7, 0.1), ell(5.2, -12.6, 3, 1.6, 8, 0.12), ell(7.4, 2.2, 2.9, 3.2, 9, 0.08)]
  for (const isl of islands) {
    const o = smoothLoop(isl, 5)
    slabShape(o, 0, 0.42)
    const [mx, mz] = isl.reduce((a, b) => [a[0] + b[0] / isl.length, a[1] + b[1] / isl.length], [0, 0])
    loop(o.map(([x, z]) => [mx + (x - mx) * 0.88, mz + (z - mz) * 0.88]), 0.42, true)
    for (let i = 0; i < isl.length; i++) bush(mx + (isl[i][0] - mx) * 0.55, mz + (isl[i][1] - mz) * 0.55, i % 2 ? 0.8 : 1.1, i + mx)
    bush(mx, mz, 1.2, mx * 2)
  }
  tree(-6.4, -10, 9, 2.4, 21)
  // 水面：几道短的波纹（软线），只画在池里、岛外
  const inside = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c } return c }
  const isl = islands.map((o) => smoothLoop(o, 5))
  const ripples = []
  for (let z = -15.5, r = 0; z < 23.5; z += 0.9 + (z > 8 ? 0.5 : 0), r++) {
    for (let x = -11 + ((r * 2.3) % 3); x < 11; x += 3.4 + ((r * 7) % 3) * 0.6) {
      const L = 0.7 + ((r + x) % 2 === 0 ? 0.5 : 0), a = [x, z], b = [x + L * 0.5, z + 0.06], c = [x + L, z]
      if (![a, b, c].every(([px, pz]) => inside(P, px, pz) && !isl.some((o) => inside(o, px, pz)) && Math.hypot(px - 7.4, pz - 2.2) > 4.2)) continue
      ripples.push([[a[0], 0.03, a[1]], [b[0], 0.03, b[1]]], [[b[0], 0.03, b[1]], [c[0], 0.03, c[1]]])
    }
  }
  seg(ripples, true)
  // 右边圆岛前面一圈喷泉：水柱从池底斜着往岛上落（抛物线）
  const jets = []
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.62 + i * 0.14), c = Math.cos(a), sn = Math.sin(a)
    const sx = 7.4 + c * 5.6, sz = 2.2 + sn * 5.8, ex = 7.4 + c * 3.2, ez = 2.2 + sn * 3.4, H = 1.5 + (i % 2) * 0.45
    let prev = [sx, 0.05, sz]
    for (let t = 1; t <= 16; t++) { const s = t / 16, p = [sx + (ex - sx) * s, 0.05 + 4 * H * s * (1 - s) + 0.35 * s, sz + (ez - sz) * s]; jets.push([prev, p]); prev = p }
  }
  seg(jets, true)
  // 右下角圆的按摩池：一圈高出来的池沿
  const spa = smoothLoop(ell(9.6, 16.6, 2.7, 2.5, 8), 5)
  slabShape(spa, 0, 0.38)
  loop(spa.map(([x, z]) => [9.6 + (x - 9.6) * 0.86, 16.6 + (z - 16.6) * 0.86]), 0.38, true)

  // ── 走道：两边花带的边线（软线）、右边走道铺地的横缝
  line(smoothLine([[12.6, -30], [12.2, -16], [10.8, -8], [12.6, -2], [13.6, 8], [13, 20]], 8), 0.02, true)
  line(smoothLine([[-12.8, -30], [-12, -16], [-12.4, -2], [-12.8, 10], [-12.4, 22]], 8), 0.02, true)
  const joints = []
  for (let z = -26; z < 22; z += 1.2) joints.push([[12.6 + (z > -2 ? 1 : 0), 0.02, z], [13.3, 0.02, z]])
  seg(joints, true)
  // 池边一圈灌木（照图：前景两边、岛后面）
  for (const [x, z, r] of [[-5.2, 19.4, 1.3], [-8, 15.2, 1.5], [-4, 22.8, 1.0], [-10.4, 10.6, 1.3], [-11.8, 4, 1.1], [-10.8, -2, 1.2], [-10.2, -14, 1], [9.8, 11.5, 1.1], [8.8, 15.4, 1.2], [11.8, 12.5, 1.3], [12.4, 23, 1.4], [9, -16.5, 1], [3, -19.5, 1.1], [-3.5, -19, 1]]) bush(x, z, r, x * 3 + z)
  // 高树：干很高、冠在上面
  for (const [x, z, h, r, s] of [[-9.6, 15, 14, 3.4, 1], [-9.2, 1.5, 13, 3, 2], [-11.4, -15, 12.5, 2.8, 3], [-11, -27, 11, 2.6, 4], [11.6, 10.5, 14, 3, 5], [12, -6, 12.5, 2.8, 6], [11.2, -20, 11.5, 2.6, 7], [11.6, -30, 10.5, 2.4, 8]]) tree(x, z, h, r, s)
  tree(-0.6, -19.5, 10.5, 5.2, 9)                                     // 尽头那棵开花的树
  return { eye, at: [-0.5, 4.6, -20], fov: 40 }
}
