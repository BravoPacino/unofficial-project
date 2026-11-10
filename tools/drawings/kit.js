// 线稿工具：面只用来挡住后面的线（消隐），真正画出来的是棱线。
// 每张图是一个 scene 函数：往 kit 里加盒子、线、树；kit 负责出图。
import * as THREE from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const PALETTES = {
  // 金线、暗底：跟总平面图同一套
  gold: { bg: '#0e0d0b', face: '#0e0d0b', shade: 0.022, line: '#c8a86b', soft: 'rgba(200,168,107,0.45)' },
  // 墨线、米白底
  ink: { bg: '#efe8da', face: '#efe8da', shade: -0.045, line: '#2a2622', soft: 'rgba(42,38,34,0.42)' },
}

export function makeKit(canvas, { palette = 'gold', width = 1600, height = 1000, dpr = 2 } = {}) {
  const P = PALETTES[palette]
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(dpr)
  renderer.setSize(width, height, false)
  renderer.setClearColor(P.bg, 1)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.5, 2000)

  // 面：和底色一样，只按朝向深浅一点点（有体积感但不抢线）
  const base = new THREE.Color(P.face)
  const faceMat = (k = 0) => {
    const c = base.clone()
    const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + k)))
    return new THREE.MeshBasicMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, side: THREE.DoubleSide })
  }
  const shadeFor = (n) => {
    // 上面最亮、朝光的一侧次之、背光最暗（量很小）
    const l = new THREE.Vector3(-0.5, 0.8, 0.6).normalize()
    return P.shade * (1 - Math.max(0, n.dot(l)))
  }

  const lines = { main: [], soft: [] }
  const tmpN = new THREE.Vector3()

  /** 一个盒子：中心 (x,y,z)，尺寸 (w,h,d)，绕 y 转 ry；棱线全画 */
  function box(x, y, z, w, h, d, { ry = 0, soft = false, edges = true } = {}) {
    const g = new THREE.BoxGeometry(w, h, d)
    const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z)
    g.applyMatrix4(m)
    // 六个面各自深浅
    const mats = []
    for (let i = 0; i < 6; i++) {
      tmpN.set([1, -1, 0, 0, 0, 0][i], [0, 0, 1, -1, 0, 0][i], [0, 0, 0, 0, 1, -1][i]).applyMatrix4(new THREE.Matrix4().makeRotationY(ry))
      mats.push(faceMat(shadeFor(tmpN)))
    }
    scene.add(new THREE.Mesh(g, mats))
    if (edges) addEdges(g, soft)
    return g
  }
  /** 任意网格（比如树冠）：面挡线，棱线按折角画 */
  function mesh(g, { soft = false, angle = 1 } = {}) {
    scene.add(new THREE.Mesh(g, faceMat(0)))
    addEdges(g, soft, angle)
  }
  function addEdges(g, soft, angle = 1) {
    const e = new THREE.EdgesGeometry(g, angle)
    const a = e.attributes.position.array
    ;(soft ? lines.soft : lines.main).push(...a)
  }
  /** 直接画线：[[x,y,z],[x,y,z]] 一对一对 */
  function seg(pairs, soft = false) {
    for (const [p, q] of pairs) (soft ? lines.soft : lines.main).push(...p, ...q)
  }
  /** 一块竖直的平面（只挡线，不画边），用来做墙上的窗框衬底 */
  function plate(x, y, z, w, h, ry = 0) {
    const g = new THREE.PlaneGeometry(w, h)
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z))
    scene.add(new THREE.Mesh(g, faceMat(0)))
  }
  /** 树：一根干 + 多面体的冠 */
  function tree(x, z, h = 7, r = 2.6, seed = 1) {
    box(x, h * 0.3, z, 0.25, h * 0.6, 0.25, { soft: true })
    // 冠：同一个顶点不管属于哪个三角形都按位置推同样的量（不然会碎成一片片）
    const g = new THREE.IcosahedronGeometry(r, 1)
    const pos = g.attributes.position
    const nz = (x, y, z) => { const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed * 4.1) * 43758.5453; return v - Math.floor(v) }
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = 0.86 + nz(+x.toFixed(3), +y.toFixed(3), +z.toFixed(3)) * 0.24
      pos.setXYZ(i, x * k, y * k * 0.82, z * k)
    }
    g.translate(x, h * 0.62 + r * 0.5, z)
    g.computeVertexNormals()
    mesh(g, { soft: true, angle: 12 })
  }

  /** 平面上一圈闭合曲线（[[x,z],...]，Catmull-Rom 圆过去），画在高度 y */
  function smoothLoop(pts, n = 8) {
    const out = []
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length]
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t
        out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)))
      }
    }
    return out
  }
  /** 不闭合的版本：两头取端点本身 */
  function smoothLine(pts, n = 8) {
    const out = [], L = pts.length, P = (i) => pts[Math.max(0, Math.min(L - 1, i))]
    for (let i = 0; i < L - 1; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t
        out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)))
      }
    }
    out.push(pts[L - 1])
    return out
  }
  function line(pts, y, soft = false) {
    const pairs = []
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; pairs.push([[a[0], y, a[1]], [b[0], y, b[1]]]) }
    seg(pairs, soft)
  }
  /** 灌木：贴地的一团（跟树冠一样的做法，压扁） */
  function bush(x, z, r = 1, seed = 1) {
    const g = new THREE.IcosahedronGeometry(r, 1)
    const pos = g.attributes.position
    const nz = (x, y, z) => { const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed * 4.1) * 43758.5453; return v - Math.floor(v) }
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i), k = 0.85 + nz(+px.toFixed(3), +py.toFixed(3), +pz.toFixed(3)) * 0.3
      pos.setXYZ(i, px * k, Math.max(py * k * 0.6, -r * 0.05), pz * k)
    }
    g.translate(x, r * 0.05, z)
    g.computeVertexNormals()
    mesh(g, { soft: true, angle: 14 })
  }
  function loop(pts, y, soft = false) {
    const pairs = []
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; pairs.push([[a[0], y, a[1]], [b[0], y, b[1]]]) }
    seg(pairs, soft)
  }
  /** 平面形状挤出一个高度（花池、岛）：上下两圈边 + 面挡线 */
  function slabShape(pts, y0, h, soft = false) {
    const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))
    const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 1 })
    g.rotateX(-Math.PI / 2); g.translate(0, y0, 0)
    scene.add(new THREE.Mesh(g, faceMat(0)))
    addEdges(g, soft, 25)
  }
  /** 地面：一大块只挡线的平面 */
  function groundPlane(y = 0) {
    const g = new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2).translate(0, y, 0)
    scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: P.face, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 })))
  }
  /** 小车：车身 + 车厢 + 四个轮子（只画外形） */
  function car(x, z, ry = 0, oy = 0) {
    const R = new THREE.Matrix4().makeRotationY(ry)
    const at = (dx, dz) => new THREE.Vector3(dx, 0, dz).applyMatrix4(R)
    const b = at(0, 0); box(x + b.x, oy + 0.75, z + b.z, 1.8, 0.8, 4.5, { ry })
    const c = at(0, 0.25); box(x + c.x, oy + 1.45, z + c.z, 1.6, 0.6, 2.3, { ry })
    for (const [dx, dz] of [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]]) {
      const w = at(dx, dz), g = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 20).rotateZ(Math.PI / 2).applyMatrix4(new THREE.Matrix4().makeRotationY(ry)).translate(x + w.x, oy + 0.34, z + w.z)
      mesh(g, { angle: 40 })
    }
  }
  /** 一组东西放到 (ox, oz)、绕 y 转 ry：返回换好坐标的 box / seg / T */
  function place(ox, oz, ry = 0, oy = 0) {
    const cs = Math.cos(ry), sn = Math.sin(ry)
    const T = (x, y, z) => [ox + x * cs + z * sn, y + oy, oz - x * sn + z * cs]
    return {
      T,
      box: (x, y, z, w, h, d, o = {}) => { const [X, Y, Z] = T(x, y, z); return box(X, Y, Z, w, h, d, { ...o, ry: ry + (o.ry || 0) }) },
      seg: (pairs, soft) => seg(pairs.map(([p, q]) => [T(...p), T(...q)]), soft),
      geo: (g) => g.applyMatrix4(new THREE.Matrix4().makeRotationY(ry).setPosition(ox, oy, oz)),
    }
  }
  /** 两条一样长的折线之间连成一条带（只挡线、不画边）：地面、挡土墙这种大面用它，不用三角剖分 */
  function ribbon(A, B, yA, yB) {
    const v = []
    for (let i = 0; i < A.length - 1; i++) {
      const a0 = [A[i][0], yA, A[i][1]], a1 = [A[i + 1][0], yA, A[i + 1][1]], b0 = [B[i][0], yB, B[i][1]], b1 = [B[i + 1][0], yB, B[i + 1][1]]
      v.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
    scene.add(new THREE.Mesh(g, faceMat(0)))
  }
  /** 光滑的东西（躺窝、坐垫）：面挡线 + 折角边 + 从 eye 看过去的外轮廓（一面朝相机、一面背着的那条边） */
  function smooth(g, eye, { soft = false, angle = 35, crease = true } = {}) {
    scene.add(new THREE.Mesh(g, faceMat(0)))
    if (crease) addEdges(g, soft, angle)
    const m = mergeVertices(g.clone().deleteAttribute('normal').deleteAttribute('uv'), 1e-4)
    const pos = m.attributes.position, idx = m.index.array, E = new THREE.Vector3(...eye)
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), cen = new THREE.Vector3()
    const front = [], edges = new Map()
    for (let f = 0; f < idx.length / 3; f++) {
      const i0 = idx[3 * f], i1 = idx[3 * f + 1], i2 = idx[3 * f + 2]
      a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2)
      n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b))
      cen.copy(a).add(b).add(c).divideScalar(3)
      front[f] = n.dot(E.clone().sub(cen)) > 0
      for (const [p, q] of [[i0, i1], [i1, i2], [i2, i0]]) { const key = p < q ? p + '_' + q : q + '_' + p; (edges.get(key) || edges.set(key, []).get(key)).push(f) }
    }
    const out = []
    for (const [key, fs] of edges) {
      if (fs.length === 2 && front[fs[0]] === front[fs[1]]) continue
      if (fs.length === 1 && !front[fs[0]]) continue
      const [p, q] = key.split('_').map(Number)
      if (fs.length === 1 && Math.hypot(pos.getX(p) - pos.getX(q), pos.getY(p) - pos.getY(q), pos.getZ(p) - pos.getZ(q)) < 0.01) continue   // 旋转体顶上的小洞
      out.push([[pos.getX(p), pos.getY(p), pos.getZ(p)], [pos.getX(q), pos.getY(q), pos.getZ(q)]])
    }
    seg(out, soft)
  }
  /** 侧面轮廓 [[z,y],...] 沿 x 挤出厚度 t（中心在 x）：跑步机扶手、单车车架这种斜的、弯的东西 */
  function prismX(pts, x, t) {
    const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)))
    const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 6 })
    g.rotateY(-Math.PI / 2); g.translate(x + t / 2, 0, 0)
    return g
  }
  /** 竖直圆柱：面挡线；轮廓线按相机位置算两条切线（EdgesGeometry 画不出光滑面的轮廓） */
  function column(x, z, r, y0, y1, eye, soft = false) {
    const g = new THREE.CylinderGeometry(r, r, y1 - y0, 24).translate(x, (y0 + y1) / 2, z)
    scene.add(new THREE.Mesh(g, faceMat(0)))
    const dx = x - eye[0], dz = z - eye[2], L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L
    seg([[[x + nx * r, y0, z + nz * r], [x + nx * r, y1, z + nz * r]], [[x - nx * r, y0, z - nz * r], [x - nx * r, y1, z - nz * r]]], soft)
    const ring = []
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, b = ((i + 1) / 24) * Math.PI * 2; for (const y of [y0, y1]) ring.push([[x + Math.cos(a) * r, y, z + Math.sin(a) * r], [x + Math.cos(b) * r, y, z + Math.sin(b) * r]]) }
    seg(ring, soft)
  }
  function render({ eye, at, fov = 32 }) {
    camera.fov = fov; camera.position.set(...eye); camera.lookAt(...at); camera.updateProjectionMatrix()
    const add = (arr, color, w) => {
      if (!arr.length) return
      const geo = new LineSegmentsGeometry().setPositions(arr)
      const mat = new LineMaterial({ color: new THREE.Color().setStyle(color.startsWith('rgba') ? color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgb($1,$2,$3)') : color), linewidth: w, transparent: color.startsWith('rgba'), opacity: color.startsWith('rgba') ? parseFloat(color.split(',')[3]) : 1, depthWrite: false })
      mat.resolution.set(width * dpr, height * dpr)
      scene.add(new LineSegments2(geo, mat))
    }
    add(lines.main, P.line, 1.5)
    add(lines.soft, P.soft, 1.2)
    renderer.render(scene, camera)
  }

  return { THREE, scene, box, mesh, seg, plate, tree, bush, render, P, smoothLoop, smoothLine, loop, line, slabShape, groundPlane, car, place, column, prismX, smooth, ribbon }
}
