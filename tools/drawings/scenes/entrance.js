// 入口：照效果图画。一个很大的混凝土门框（左墙、厚屋顶板、右墙）罩住进来的车道，屋顶底下一整片木条吊顶；
// 门框里靠右是两层高的玻璃门卫亭（黑色竖梃），右墙横木条饰面、左墙前面竖木条；进口的拦车杆抬着，
// 右边出口在一个黑色钢构矮雨棚下面，拦车杆放下；左边一栋多层的停车楼、前面矮墙花池。米数是按图估的。

function plant(k, x, z, h, n, L, seed) {
  const out = [], rnd = (i) => { const v = Math.sin(i * 91.7 + seed * 13.1) * 43758.5; return v - Math.floor(v) }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(i) * 0.8, len = L * (0.7 + rnd(i + 9) * 0.5), up = h * (0.6 + rnd(i + 3) * 0.6), W = len * 0.16, ca = Math.cos(a), sa = Math.sin(a)
    const pt = (t, side) => { const d = len * t, y = up * Math.sin(Math.PI * t * 0.75) - up * 0.25 * t * t, w = side * W * Math.sin(Math.PI * t); return [x + ca * d - sa * w, y, z + sa * d + ca * w] }
    for (const side of [-1, 0, 1]) for (let s = 0; s < 8; s++) out.push([pt(s / 8, side), pt((s + 1) / 8, side)])
  }
  k.seg(out, true)
}

export default function entrance(k) {
  const { box, seg, tree, bush, line } = k
  const eye = [-13.5, 1.6, 16]
  k.groundPlane()
  const rectZ = (x0, y0, x1, y1, z, soft = false) => seg([[[x0, y0, z], [x1, y0, z]], [[x1, y0, z], [x1, y1, z]], [[x1, y1, z], [x0, y1, z]], [[x0, y1, z], [x0, y0, z]]], soft)
  const rectX = (z0, y0, z1, y1, x, soft = false) => seg([[[x, y0, z0], [x, y0, z1]], [[x, y0, z1], [x, y1, z1]], [[x, y1, z1], [x, y1, z0]], [[x, y1, z0], [x, y0, z0]]], soft)

  // ── 大门框：左墙、右墙、厚屋顶板（门框进深 14 m）
  const X0 = -8, X1 = 8, D = 14, H = 8.6, T = 1.1
  box(X0 + 0.45, H / 2, -D / 2, 0.9, H, D)
  box(X1 - 0.6, H / 2, -D / 2, 1.2, H, D)
  box(0, H + T / 2, -D / 2, X1 - X0, T, D)
  // 屋顶底下的木条吊顶（顺着进深方向）+ 几盏筒灯
  const sof = []
  for (let x = X0 + 1.1; x < X1 - 1.3; x += 0.32) sof.push([[x, H - 0.01, -0.2], [x, H - 0.01, -D + 0.2]])
  seg(sof, true)
  for (const [x, z] of [[-5, -2], [-1, -3], [3, -2.5], [-3, -7], [1.5, -8], [5, -6.5], [-5, -11], [0, -12]]) {
    const r = 0.12, c = []
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, b = ((i + 1) / 10) * Math.PI * 2; c.push([[x + Math.cos(a) * r, H - 0.02, z + Math.sin(a) * r], [x + Math.cos(b) * r, H - 0.02, z + Math.sin(b) * r]]) }
    seg(c)
  }
  // 左墙正面一片竖木条；右墙正面、里面横木条
  for (let x = X0 + 0.08; x < X0 + 0.86; x += 0.12) seg([[[x, 0.3, 0.01], [x, 6.2, 0.01]]], true)
  for (let y = 0.4; y < H - 0.2; y += 0.28) seg([[[X1 - 1.2, y, 0.01], [X1, y, 0.01]], [[X1 - 1.21, y, -0.2], [X1 - 1.21, y, -D + 0.2]]], true)

  // ── 门卫亭：两层高的玻璃盒子（贴着右墙），黑色竖梃 + 两道横档
  const g0 = 2.4, g1 = X1 - 1.2, gz0 = -2.6, gz1 = -8.4
  box((g0 + g1) / 2, 0.15, (gz0 + gz1) / 2, g1 - g0, 0.3, gz0 - gz1, { soft: true })
  const gl = []
  for (let x = g0; x <= g1 + 0.01; x += (g1 - g0) / 5) gl.push([[x, 0.3, gz0], [x, H, gz0]])
  for (let z = gz0; z >= gz1 - 0.01; z -= (gz0 - gz1) / 6) gl.push([[g0, 0.3, z], [g0, H, z]])
  for (const y of [0.3, 3.0, 6.0]) gl.push([[g0, y, gz0], [g1, y, gz0]], [[g0, y, gz0], [g0, y, gz1]])
  seg(gl)
  // 亭子里：一张前台
  box(g0 + 2, 0.55, gz0 - 1.6, 2.6, 1.1, 0.7, { soft: true })
  // 亭子左边一根细高的墙片
  box(g0 - 0.5, H / 2, gz0 - 0.4, 0.6, H, 0.8)

  // ── 进口：车道两边的路缘、中间分隔岛、抬起来的拦车杆
  seg([[[X0 + 0.9, 0.01, 6], [X0 + 0.9, 0.01, -D]], [[g0 - 0.8, 0.01, 6], [g0 - 0.8, 0.01, -D]]], true)
  box(g0 - 0.5, 0.6, -1.2, 0.36, 1.2, 0.36)
  seg([[[g0 - 0.6, 1.0, -1.2], [g0 - 0.6 - 3.0, 1.0 + 5.2, -1.2]], [[g0 - 0.4, 1.0, -1.2], [g0 - 0.4 - 3.0, 1.0 + 5.2, -1.2]]])
  // 门框前面左边：矮墙花池
  box(-11.5, 0.5, 4.2, 6.4, 1.0, 0.4); box(-14.5, 0.5, 2.0, 0.4, 1.0, 4.8); box(-11.5, 1.3, 2.6, 6.2, 0.6, 3.2, { soft: true, edges: false })
  for (const [x, z, h, n, L] of [[-12, 2.6, 1.6, 10, 1.6], [-9.5, 2.4, 1.2, 8, 1.3], [-14, 3.2, 0.9, 8, 1.0]]) plant(k, x, z + 0.0, h, n, L, x * z)
  for (const [x, z, r] of [[-13.2, 2.2, 0.9], [-10.4, 3.2, 0.8], [-8.6, 2.0, 0.8]]) bush(x, z, r, x)

  // ── 右边出口：黑色钢构矮雨棚（细柱 + 平顶）+ 放下的拦车杆
  const c0 = X1 + 0.4, c1 = X1 + 14, cz0 = 1.5, cz1 = -10, ch = 4.2
  box((c0 + c1) / 2, ch + 0.15, (cz0 + cz1) / 2, c1 - c0, 0.3, cz0 - cz1)
  for (const x of [c0 + 0.3, c0 + 4.8, c0 + 9.3, c1 - 0.3]) for (const z of [cz0 - 0.3, cz1 + 0.3]) box(x, ch / 2, z, 0.18, ch, 0.18)
  const bars = []
  for (let x = c0 + 0.6; x < c1; x += 0.5) bars.push([[x, ch, cz0], [x, ch, cz1]])
  seg(bars, true)
  box(c0 + 0.8, 0.6, 0.5, 0.36, 1.2, 0.36)
  seg([[[c0 + 0.8, 1.0, 0.6], [c0 + 6.5, 1.0, 0.6]], [[c0 + 0.8, 0.9, 0.6], [c0 + 6.5, 0.9, 0.6]]])
  box(c0 + 9, 0.45, -4, 3.5, 0.9, 1.2, { soft: true })                      // 出口旁的花槽

  // ── 左边的多层停车楼：几层厚楼板 + 柱子 + 女儿墙
  const P0 = -40, P1 = -10, pz0 = -3, pz1 = -24
  for (const y of [3.4, 6.8]) box((P0 + P1) / 2, y, (pz0 + pz1) / 2, P1 - P0, 0.5, pz0 - pz1)
  box((P0 + P1) / 2, 7.6, pz0 + 0.1, P1 - P0, 1.1, 0.2)
  for (let x = P0 + 1; x <= P1; x += 7) for (const z of [pz0 - 0.4, pz1 + 0.4]) box(x, 3.4, z, 0.5, 6.8, 0.5)
  box((P0 + P1) / 2, 0.6, pz0 + 1.2, P1 - P0, 1.2, 0.3)                    // 前面一道矮墙

  // ── 车：红车正在进门框，灰车在出口外面
  k.car(-4.5, 1.2, 0)
  k.car(c0 + 10, 4.5, Math.PI / 2)
  // 路：路缘线、车道线
  line([[-40, 7], [-14.6, 7]], 0.01); line([[-14.6, 7], [-14.6, 0]], 0.01, true)
  line([[X1 + 0.2, 8], [40, 8]], 0.01); line([[X1 + 0.2, 6.2], [40, 6.2]], 0.01, true)
  // 树
  for (const [x, z, h, r, s] of [[-10.5, -1.5, 14, 3.4, 1], [-18, -1.5, 11, 3, 2], [22, -6, 10, 3, 3], [17, -16, 11, 3, 4], [-4, -22, 11, 3, 5]]) tree(x, z, h, r, s)
  return { eye, at: [1.5, 5.2, -4], fov: 52 }
}
