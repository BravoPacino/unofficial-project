// 把效果图上的像素点反投到某个高度的水平面上（用 fit-walkway 解出的镜头），量位置用。
// 把效果图上的像素点反投影到某个高度的水平面上（用拟合出的镜头）：node unp.cjs y x1,y1 x2,y2 ...
const W = 1400, H = 840, ASPECT = 2, eye = [-8.2, 8.9, 21.2], at = [7.8, -1.35, -8.6], fov = 51.5
const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0)
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l) }
const f = norm(sub(at, eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f)
const tanH = Math.tan((fov * Math.PI) / 360) * ASPECT, tanV = tanH * (H / W)
const [y0, ...pts] = process.argv.slice(2)
for (const p of pts) {
  const [px, py] = p.split(',').map(Number), sx = (px / W) * 2 - 1, sy = 1 - (py / H) * 2
  const d = norm(f.map((v, i) => v + r[i] * sx * tanH + u[i] * sy * tanV)), t = (+y0 - eye[1]) / d[1]
  console.log(p, '→', [eye[0] + d[0] * t, eye[2] + d[2] * t].map((v) => v.toFixed(2)).join(', '))
}
