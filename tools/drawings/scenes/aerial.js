// 泳池鸟瞰：照效果图画（竖图）。从高处顺着一条弯弯的长泳池往远处看：左边一排 Courtyard Villas，
// 右边一条宽的石板走道，池边一串种满植物的半岛、很多树；池中间一艘木头海盗船，尽头是儿童戏水区（小池 + 滑梯塔）。米数是按图估的。
import { villaRow } from './villas.js'

const inside = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c } return c }
const offset = (pts, d) => pts.map((p, i) => {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1])
  const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, dd = typeof d === 'function' ? d(p, i) : d
  return [p[0] + tz * dd, p[1] - tx * dd]
})

export default function aerial(k) {
  const { tree, bush, smoothLine, smoothLoop, loop, line, slabShape, seg, box } = k
  const eye = [-3.5, 21, 25]
  k.groundPlane()
  villaRow(k, { n: 15, ox: -15, oz: 14, ry: Math.PI / 2, ground: false, yard: true })

  // ── 泳池：沿一条弯的中线，左右各一个随位置变的半宽，两边连成一圈
  const C = smoothLine([[-1, 16], [0.5, 4], [-2.5, -8], [1.5, -19], [-0.5, -30], [2.5, -41], [6.5, -50], [5, -58]], 6)
  const half = ([, z]) => z > 6 ? 7 : z > -4 ? 6 - (6 - z) * 0.05 : z > -14 ? 3.8 : z > -24 ? 3.4 : z > -35 ? 5.2 : z > -45 ? 3 : 4
  const wob = ([x, z], s) => half([x, z]) * (1 + 0.18 * Math.sin(z * 0.45 + s))
  const Lb = offset(C, (p) => wob(p, 0)), Rb = offset(C, (p) => -wob(p, 2))
  const P = smoothLoop([...Lb, ...Rb.slice().reverse()].filter((_, i) => i % 2 === 0), 4)
  loop(P, 0.03)
  loop(offset([...P, P[0]], 0.45).slice(0, -1), 0.03, true)
  // 池边的半岛（种满植物的矮池沿）
  const pens = [[-6.2, 4, 2.6, 2.2], [4.6, -6, 2.4, 1.8], [-4.4, -15, 2.0, 2.4], [4.2, -24, 2.2, 1.8], [-3.6, -37, 2.0, 1.6], [6.2, -36, 2.4, 2.0]]
  const pen = pens.map(([x, z, rx, rz]) => smoothLoop(Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2; return [x + Math.cos(a) * rx * (1 + 0.15 * Math.sin(a * 3 + x)), z + Math.sin(a) * rz] }), 4))
  for (const [i, o] of pen.entries()) { slabShape(o, 0, 0.45); const [x, z, rx] = pens[i]; bush(x, z, rx * 0.6, i * 3); bush(x + rx * 0.4, z + 0.5, rx * 0.4, i * 7) }
  // 水纹
  const rip = []
  for (let z = -60, r = 0; z < 22; z += 1.1, r++) for (let x = -10 + ((r * 1.9) % 3); x < 14; x += 2.8 + (r % 3) * 0.4) {
    const a = [x, z], b = [x + 0.6, z + 0.06], c = [x + 1.2, z]
    if ([a, b, c].every((p) => inside(P, ...p) && !pen.some((o) => inside(o, ...p)) && Math.hypot(p[0] + 0.5, p[1] + 30) > 4)) rip.push([[a[0], 0.03, a[1]], [b[0], 0.03, b[1]]], [[b[0], 0.03, b[1]], [c[0], 0.03, c[1]]])
  }
  seg(rip, true)

  // ── 木头海盗船（池中间）：船身侧面轮廓挤出、甲板、桅杆、船尾小楼
  const sh = k.place(-0.5, -30, 0.5)
  k.mesh(sh.geo(k.prismX([[-3.4, 1.5], [3.8, 1.8], [3.0, 0.0], [-2.6, 0.0]], 0, 2.4)), { angle: 20 })
  sh.box(0, 4.2, 0.6, 0.16, 5.4, 0.16); sh.box(0, 2.6, -2.2, 2.2, 1.6, 1.4)
  sh.seg([[[0, 6.6, 0.6], [0.9, 6.2, 0.6]], [[0.9, 6.2, 0.6], [0, 5.8, 0.6]]])
  const sail = []
  for (let y = 2.6; y <= 5.8; y += 0.4) sail.push([[-0.9, y, 0.68], [0.9, y, 0.68]])
  sh.seg(sail, true)
  // ── 尽头的儿童戏水区：小圆池、滑梯塔、一道弯滑梯
  const kid = smoothLoop([[3, -55], [9, -56.5], [12, -60], [7, -63], [2, -61]], 5)
  loop(kid, 0.03); slabShape(smoothLoop([[8, -59.5], [10, -59.5], [10, -61.5], [8, -61.5]], 2), 0, 0.3, true)
  box(10.5, 2.2, -64, 2.2, 4.4, 2.2)
  const slide = []
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 1.6, b = ((i + 1) / 24) * Math.PI * 1.6, f = (t) => [10.5 + Math.cos(t) * 2.6, 4.2 - t * 1.4, -64 + Math.sin(t) * 2.6]; slide.push([f(a), f(b)]) }
  seg(slide)

  // ── 右边的石板走道（两条边 + 铺地缝）
  const W1 = offset(C, -9), W2 = offset(C, -16)
  line(W1, 0.01); line(W2, 0.01, true)
  const pj = []
  for (let i = 0; i < W1.length; i += 2) pj.push([[W1[i][0], 0.01, W1[i][1]], [W2[i][0], 0.01, W2[i][1]]])
  seg(pj, true)
  // 左边：池和别墅之间一条窄走道的边
  line(offset(C, 9.2).filter(([x]) => x > -13), 0.01, true)

  // ── 树：近处中间一棵很大、两边一排
  tree(3.5, 11, 11, 3.8, 1)
  for (const [x, z, h, r, s] of [[-10, 8, 11, 3, 2], [-9, -4, 11, 3, 3], [-9.5, -18, 10.5, 2.8, 4], [-8.6, -30, 10, 2.6, 5], [-8, -44, 9.5, 2.4, 6], [9.5, 2, 11, 3, 7], [8.6, -12, 10.5, 2.8, 8], [9.2, -26, 10, 2.6, 9], [11, -40, 9.5, 2.4, 10], [14, -50, 9, 2.4, 11], [-2, -48, 8.5, 2.4, 12], [-7, -60, 9, 2.6, 13], [4, -70, 9, 2.8, 14], [12, -64, 9, 2.6, 15], [-6, -78, 9, 2.6, 16], [9, -82, 9, 2.8, 17], [1, -92, 9, 3, 18], [16, -76, 9, 2.6, 19]]) tree(x, z, h, r, s)
  for (const [x, z, r] of [[-7.6, 12, 1.4], [-8, -10, 1.2], [7.6, -2, 1.3], [7.4, -18, 1.1], [-7.2, -24, 1.2], [8, -32, 1.1]]) bush(x, z, r, x * z)
  return { eye, at: [-2.5, -6, -30], fov: 62 }
}
