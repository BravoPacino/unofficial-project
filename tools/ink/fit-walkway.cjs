// 人行桥：用效果图上读出来的几条线（车道两侧墙脚和墙顶、房子门框脚、桥两侧栏杆顶、远栏杆圆头）反解镜头、车道宽、桥的位置。
// node tools/ink/fit-walkway.cjs ；结果抄进 tools/drawings/scenes/walkway.js 的 VIEW / BRIDGE / HALF。
// 用效果图上确定的几条线解镜头和桥的位置（最小二乘，Nelder–Mead）
const W = 1400, H = 840, ASPECT = 2
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l) }
function cam(eye, at, fov) {
  const f = norm(sub(at, eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f)
  const tanH = Math.tan((fov * Math.PI) / 360) * ASPECT, tanV = tanH * (H / W)
  return (p) => { const d = sub(p, eye), z = dot(d, f); if (z < 0.1) return [1e5, 1e5]; return [((dot(d, r) / z / tanH + 1) / 2) * W, ((1 - dot(d, u) / z / tanV) / 2) * H] }
}
// a world line through p0 with direction dir; image points that must lie on it
const distToLine = (P, p0, dir, q) => { const a = P(p0), b = P([p0[0] + dir[0] * 10, p0[1] + dir[1] * 10, p0[2] + dir[2] * 10]); const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return Math.abs((q[0] - a[0]) * dy - (q[1] - a[1]) * dx) / L }
const Z = [0, 0, -1]
function cost(v, report) {
  const [ex, ey, ez, ax, ay, az, fov, Ax, Az, Bx, Bz, hw, hp, hx, Wb] = v
  if (fov < 12 || fov > 80 || hw < 3 || hw > 6 || hp < 0.9 || hp > 1.3 || hx < 3 || hx > 14 || Wb < 3.5 || Wb > 7) return 1e9
  const lines = [
    [[hw, -3.2, 0], Z, [[437, 306], [531, 362], [620, 419]]],          // foot of the right wall (garage bottoms)
    [[hw, hp, 0], Z, [[400, 253], [775, 409], [962, 512]]],            // top of the solid white wall on the right bank
    [[hw + hx, 0, 0], Z, [[575, 322], [703, 384], [1080, 520]]],       // foot of the house portals
    [[-hw, 0, 0], Z, [[470, 590], [600, 840]]],                        // left road edge near the camera
  ]
  const P = cam([ex, ey, ez], [ax, ay, az], fov)
  let c = 0, out = []
  for (const [p0, d, qs] of lines) for (const q of qs) { const e = distToLine(P, p0, d, q); c += e * e; out.push(e.toFixed(0)) }
  // the bridge: top of the bars on the far side and the near side (y 1.25), the rounded end's foot (far side, y 0.15)
  const dx = Bx - Ax, dz = Bz - Az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, vx = -uz, vz = ux
  const farP = (t, y) => [Ax + ux * t - vx * (Wb / 2), y, Az + uz * t - vz * (Wb / 2)], nearP = (t, y) => [Ax + ux * t + vx * (Wb / 2), y, Az + uz * t + vz * (Wb / 2)]
  for (const q of [[356, 400], [931, 525]]) { const e = distToLine(P, farP(0, 1.25), [ux, 0, uz], q); c += e * e; out.push('f' + e.toFixed(0)) }
  for (const q of [[212, 406], [1050, 631]]) { const e = distToLine(P, nearP(0, 1.25), [ux, 0, uz], q); c += e * e; out.push('n' + e.toFixed(0)) }
  const end = P(farP(L, 0.15)); { const e = Math.hypot(end[0] - 962, end[1] - 594); c += e * e; out.push('end' + e.toFixed(0)) }
  // the bridge lands on the right walk: its far end must reach x ≥ 4.2 (the walk) and stay short of the planter
  const ex2 = farP(L, 0)[0]; if (ex2 < hw + 0.5) c += (hw + 0.5 - ex2) ** 2 * 400; if (ex2 > hw + hx) c += (ex2 - hw - hx) ** 2 * 400
  const ax2 = nearP(0, 0)[0]; if (ax2 > -hw - 0.5) c += (ax2 + hw + 0.5) ** 2 * 400
  if (ey < 3 || ey > 25) c += 1e6
  if (report) console.log(out.join(' '))
  return c
}
function nm(f, x0, step, iters = 6000) {
  let s = [x0, ...x0.map((_, i) => x0.map((v, j) => (i === j ? v + step[i] : v)))].map((x) => [x, f(x)])
  for (let k = 0; k < iters; k++) {
    s.sort((a, b) => a[1] - b[1]); const n = x0.length, c = Array(n).fill(0)
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += s[i][0][j] / n
    const w = s[n][0], r = c.map((v, j) => v + (v - w[j])), fr = f(r)
    if (fr < s[0][1]) { const e = c.map((v, j) => v + 2 * (r[j] - v)), fe = f(e); s[n] = fe < fr ? [e, fe] : [r, fr] }
    else if (fr < s[n - 1][1]) s[n] = [r, fr]
    else { const ct = c.map((v, j) => v + 0.5 * (w[j] - v)), fc = f(ct); if (fc < s[n][1]) s[n] = [ct, fc]; else s = s.map((p, i) => (i ? [p[0].map((v, j) => s[0][0][j] + 0.5 * (v - s[0][0][j])), f(p[0].map((v, j) => s[0][0][j] + 0.5 * (v - s[0][0][j])))] : p)) }
  }
  s.sort((a, b) => a[1] - b[1]); return s[0]
}
let best = null
for (let trial = 0; trial < 60; trial++) {
  const r = (a, b) => a + Math.random() * (b - a)
  const x0 = [r(-8, 4), r(6, 18), r(10, 30), r(-4, 4), r(-3, 1), r(-20, 0), r(30, 55), r(-11, -5), r(-16, 0), r(3, 9), r(-2, 12), r(3, 4.5), r(0.6, 1.2), r(4, 10), r(4, 6)]
  const res = nm(cost, x0, [2, 2, 3, 2, 1, 3, 5, 2, 3, 2, 3, 0.4, 0.2, 1.5, 0.5], 9000)
  if (!best || res[1] < best[1]) best = res
}
console.log('cost', best[1].toFixed(0), JSON.stringify(best[0].map((v) => +v.toFixed(2))))
cost(best[0], true)
