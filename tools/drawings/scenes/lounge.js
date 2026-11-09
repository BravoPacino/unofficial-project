// Lounge：照效果图画。草地上一块弯月形的木平台，上面两张藤编躺窝（碗形、厚坐垫、两个靠枕，开口斜着朝人）；
// 平台右头几块踏步石接到一条弯的石板走道；后面是泳池和小岛，左后一排别墅，右后是玻璃健身亭和一个折板木门洞。米数是按图估的。
import { villaRow } from './villas.js'
import { pavilion } from './gym.js'

const inside = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c } return c }

/** 一条直线在多边形里的几段（用来画木地板缝、铺地缝） */
function clipLine(poly, [ax, az], [bx, bz], step = 0.08) {
  const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / step), out = []
  let run = null
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = [ax + (bx - ax) * t, az + (bz - az) * t], ins = inside(poly, ...p)
    if (ins && !run) run = [p, p]; else if (ins) run[1] = p; else if (run) { out.push(run); run = null }
  }
  if (run) out.push(run)
  return out
}

/** 藤编躺窝：碗形（外壁 + 一圈厚边 + 里面），外壁上画编织纹；开口往 +z 斜 tilt，绕 y 转 ry */
function nest(k, x, z, ry, tilt, eye, s = 1) {
  const { THREE } = k
  const M = new THREE.Matrix4().makeTranslation(x, 0.15, z).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(new THREE.Matrix4().makeRotationX(tilt)).multiply(new THREE.Matrix4().makeScale(s, s, s))
  const prof = [[0.001, 0.0], [0.45, 0.03], [0.8, 0.14], [1.02, 0.32], [1.1, 0.52], [1.07, 0.7], [0.98, 0.84], [0.9, 0.9], [0.83, 0.86], [0.84, 0.72], [0.76, 0.58], [0.5, 0.5], [0.001, 0.48]]
  const shell = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40).applyMatrix4(M)
  k.smooth(shell, eye, { angle: 40 })
  // 编织纹：外壁上几圈纬线 + 斜着的经线（软线），稍微往外一点免得被面盖住
  const at = (r, y, a) => new THREE.Vector3(Math.cos(a) * r * 1.01, y, Math.sin(a) * r * 1.01).applyMatrix4(M).toArray()
  const rimR = (y) => { for (let i = 0; i < 7; i++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1]; if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0) } return 1 }
  const weave = []
  for (const y of [0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.8]) for (let i = 0; i < 48; i++) weave.push([at(rimR(y), y, (i / 48) * Math.PI * 2), at(rimR(y), y, ((i + 1) / 48) * Math.PI * 2)])
  for (let j = 0; j < 30; j++) for (let i = 0; i < 8; i++) {
    const y0 = 0.04 + i * 0.1, y1 = y0 + 0.1, a0 = (j / 30) * Math.PI * 2 + i * 0.07, a1 = a0 + 0.07
    weave.push([at(rimR(y0), y0, a0), at(rimR(y1), y1, a1)])
  }
  k.seg(weave, true)
  // 坐垫（厚的圆饼）+ 两个靠枕（在后面靠着边）
  const cush = new THREE.LatheGeometry([[0.001, 0.56], [0.62, 0.57], [0.76, 0.62], [0.78, 0.7], [0.66, 0.76], [0.001, 0.77]].map(([r, y]) => new THREE.Vector2(r, y)), 40).applyMatrix4(M)
  k.smooth(cush, eye, { crease: false })
  for (const sx of [-1, 1]) {
    // 方枕：球的 x、y 往外推成方的，z 压扁
    const p = new THREE.SphereGeometry(1, 24, 16), a = p.attributes.position
    for (let i = 0; i < a.count; i++) { const X = a.getX(i), Y = a.getY(i), Z = a.getZ(i); a.setXYZ(i, Math.sign(X) * Math.abs(X) ** 0.45 * 0.3, Math.sign(Y) * Math.abs(Y) ** 0.45 * 0.25, Z * 0.09) }
    p.scale(0.9, 0.9, 1).rotateX(-0.75).rotateY(-sx * 0.25).translate(sx * 0.3, 0.86, -0.42).applyMatrix4(M)
    k.smooth(p, eye, { crease: false })
  }
}

/** 一丛叶子：每片叶子是一条弯的叶脉 + 两边弧线（软线，不挡线） */
function plant(k, x, z, h, n, L, seed) {
  const out = [], rnd = (i) => { const v = Math.sin(i * 91.7 + seed * 13.1) * 43758.5; return v - Math.floor(v) }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(i) * 0.8, len = L * (0.7 + rnd(i + 9) * 0.5), up = h * (0.6 + rnd(i + 3) * 0.6), W = len * 0.16
    const ca = Math.cos(a), sa = Math.sin(a), pt = (t, side) => {
      const d = len * t, y = up * Math.sin(Math.PI * t * 0.75) - up * 0.25 * t * t, w = side * W * Math.sin(Math.PI * t)
      return [x + ca * d - sa * w, y + 0.02, z + sa * d + ca * w]
    }
    for (const side of [-1, 0, 1]) for (let s = 0; s < 8; s++) out.push([pt(s / 8, side), pt((s + 1) / 8, side)])
  }
  k.seg(out, true)
}

/** 折板木门洞（侧面轮廓挤出），下面两张躺椅 */
function portal(k, x, z, ry) {
  const p = k.place(x, z, ry)
  const prof = [[0, 0], [0, 3.3], [1.7, 4.1], [4.1, 3.3], [4.5, 0], [4.1, 0], [3.75, 3.0], [1.7, 3.68], [0.4, 3.02], [0.4, 0]]
  k.mesh(p.geo(k.prismX(prof, 0, 2.8).rotateY(Math.PI / 2).translate(-1.4, 0, 0)), { angle: 20 })
  // 门洞里面沿着折线一条灯带（软线）
  p.seg([[[-1.4, 2.95, 0.45], [-1.4, 3.6, 1.7]], [[-1.4, 3.6, 1.7], [-1.4, 2.95, 3.7]]], true)
  for (const dx of [-0.6, 0.6]) { p.box(dx, 0.25, 2.0, 0.7, 0.2, 1.8, { soft: true }); p.box(dx, 0.45, 1.25, 0.7, 0.4, 0.1, { soft: true, ry: 0 }) }
}

export default function lounge(k) {
  const { tree, bush, smoothLoop, loop, line, smoothLine, slabShape, seg } = k
  const eye = [1.0, 1.95, 8.6]
  k.groundPlane()

  // ── 后面：左后一排别墅（斜着往右后退），右后玻璃健身亭 + 折板门洞
  villaRow(k, { n: 6, ox: -44, oz: -20, ry: 0.3, ground: false, yard: true })
  pavilion(k, { ox: 12.5, oz: -17, ry: -0.45, W: 9, D: 7, H: 5, eye })
  portal(k, 8.8, -8.5, -0.6)

  // ── 泳池（平台后面）+ 池中一个花岛 + 水纹
  const P = smoothLoop([[-15, 0.5], [-8, -1.2], [-3.2, -1.6], [1.5, -3.6], [6, -4.8], [9.5, -6.2], [8, -8.4], [2, -9.6], [-4, -9], [-9, -11], [-15, -9.5]], 8)
  loop(P, 0.03); loop(P.map(([x, z]) => [x * 0.985, -4.5 + (z + 4.5) * 0.93]), 0.03, true)
  const isl = smoothLoop([[-3, -6.2], [1.5, -6.8], [3.5, -7.6], [0, -8.2], [-3.5, -7.4]], 5)
  slabShape(isl, 0, 0.4); for (const [x, z, r] of [[-2.2, -7, 0.8], [-0.6, -7.3, 0.9], [1.2, -7.4, 0.8], [2.6, -7.5, 0.6]]) bush(x, z, r, x * 5)
  const rip = []
  for (let z = -10.5, r = 0; z < 0.5; z += 0.8, r++) for (let x = -15 + ((r * 1.7) % 3); x < 10; x += 2.6 + (r % 3) * 0.5) {
    const a = [x, z], b = [x + 0.55, z + 0.05], c = [x + 1.1, z]
    if ([a, b, c].every((p) => inside(P, ...p) && !inside(isl, ...p))) rip.push([[a[0], 0.03, a[1]], [b[0], 0.03, b[1]]], [[b[0], 0.03, b[1]], [c[0], 0.03, c[1]]])
  }
  seg(rip, true)

  // ── 弯月形木平台 + 地板缝（顺着长边）
  const deck = smoothLoop([[-6.8, 2.6], [-3.6, 0.9], [0.4, -0.3], [3.6, -0.9], [5.2, -0.4], [3.8, 1.4], [0.6, 3.4], [-3.4, 4.4]], 8)
  slabShape(deck, 0, 0.15)
  const dir = [0.94, -0.33], nrm = [0.33, 0.94], boards = []
  for (let o = -4; o < 4; o += 0.22) {
    const cx = -0.8 + nrm[0] * o, cz = 1.8 + nrm[1] * o
    for (const [p, q] of clipLine(deck, [cx - dir[0] * 9, cz - dir[1] * 9], [cx + dir[0] * 9, cz + dir[1] * 9])) boards.push([[p[0], 0.151, p[1]], [q[0], 0.151, q[1]]])
  }
  seg(boards, true)
  // 两张躺窝：左边那张更近、更大一点，开口都斜着朝人
  nest(k, -2.2, 2.2, 0.35, 0.32, eye, 1.12)
  nest(k, 1.9, 0.5, -0.1, 0.28, eye, 1.0)

  // ── 踏步石 → 弯的石板走道（两条边 + 横缝）
  for (const [x, z, r, s] of [[2.9, 2.8, 0.4, 1], [2.1, 3.8, 0.42, 2], [2.8, 4.7, 0.38, 3]]) {
    const st = smoothLoop(Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2 + s; return [x + Math.cos(a) * r * (1 + 0.25 * Math.sin(a * 2 + s)), z + Math.sin(a) * r * 0.7] }), 4)
    slabShape(st, 0, 0.06, true)
  }
  const inner = smoothLine([[1.4, 9], [2.8, 6.4], [4.8, 3.6], [6.8, 1.2], [9, -1.8], [11.4, -5.6]], 10)
  const outer = smoothLine([[5.2, 9.6], [6.4, 7.4], [8.4, 5.4], [10.6, 3.4], [12.8, 0.4], [15.2, -3.6]], 10)
  line(inner, 0.02); line(outer, 0.02)
  const joints = []
  for (let i = 0; i < inner.length; i += 2) { const j = Math.round((i / (inner.length - 1)) * (outer.length - 1)); joints.push([[inner[i][0], 0.02, inner[i][1]], [outer[j][0], 0.02, outer[j][1]]]) }
  seg(joints, true)

  // ── 树（高干、冠在上面）和前景的植物
  for (const [x, z, h, r, s] of [[-3.8, -0.6, 9.5, 3.6, 1], [3.2, -2.6, 9, 3.4, 2], [-10.5, -3, 9.5, 3, 3], [7.6, -7.5, 10, 3, 4], [10.5, -2.6, 9, 2.8, 5], [-14, 1.2, 9.5, 3, 6]]) tree(x, z, h, r, s)
  for (const [x, z, r] of [[7.4, -3.6, 1.1], [-8.4, 2.2, 1.0], [4.6, -1.8, 1.0]]) bush(x, z, r, x + z * 3)
  // 前景的植物：一丛丛叶子（只画线，不挡后面）
  for (const [x, z, h, n, L] of [[-2.2, 5.2, 1.3, 10, 1.6], [-3.9, 4.3, 1.0, 8, 1.2], [-0.4, 5.9, 0.6, 8, 0.8], [6.0, -1.2, 1.1, 8, 1.2], [-6.6, 2.8, 0.8, 7, 1.0], [1.4, 6.2, 0.4, 9, 0.6]]) plant(k, x, z, h, n, L, x * 7 + z)
  return { eye, at: [0.9, 1.0, -2], fov: 50 }
}
