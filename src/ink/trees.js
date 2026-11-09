// Bare trees for the ink drawings: a trunk that forks again and again, drawn as tapering strokes on a 2D canvas.
// Same seed, same tree.
const rng = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** (x, y): foot of the trunk in CSS px · px: pixels per metre · h: height in metres */
export function drawTree(ctx, x, y, px, h, seed, color) {
  const r = rng(seed)
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const branch = (x, y, a, len, w, depth) => {
    const a2 = a + (r() - 0.5) * 0.3                                  // a slight bend half-way
    const mx = x + Math.sin(a) * len * 0.5 * px, my = y - Math.cos(a) * len * 0.5 * px
    const ex = mx + Math.sin(a2) * len * 0.5 * px, ey = my - Math.cos(a2) * len * 0.5 * px
    ctx.lineWidth = Math.max(0.5, w * px)
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(mx, my); ctx.lineTo(ex, ey); ctx.stroke()
    if (depth >= 8 || len < 0.22 || (depth > 4 && r() < 0.12)) return
    const n = depth === 0 ? 3 : r() < 0.26 ? 3 : 2
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5
      const na = a2 * 0.72 + t * (depth < 2 ? 0.62 : 0.6) * (0.7 + r() * 0.6) + (r() - 0.5) * 0.3
      branch(ex, ey, na, len * (0.68 + r() * 0.2), w * (n === 3 ? 0.6 : 0.68), depth + 1)
    }
  }
  branch(x, y, (r() - 0.5) * 0.1, h * 0.27, h * 0.03, 0)
}
