// 颗粒 = 两层平滑的随机噪声相加；要让「墨的覆盖率」等于想要的值，得知道噪声的分布。这里数一下分位数，拟合一条 logistic 曲线。
const N = 512, mk = () => { const a = new Float32Array(N * N); for (let i = 0; i < a.length; i++) a[i] = Math.random(); return a }
const A = mk(), B = mk(), at = (g, x, y) => g[((y % N + N) % N) * N + ((x % N + N) % N)]
const vn = (g, x, y) => { const i = Math.floor(x), j = Math.floor(y); let fx = x - i, fy = y - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
  return (at(g, i, j) * (1 - fx) + at(g, i + 1, j) * fx) * (1 - fy) + (at(g, i, j + 1) * (1 - fx) + at(g, i + 1, j + 1) * fx) * fy }
const v = []
for (let k = 0; k < 400000; k++) { const x = Math.random() * 400, y = Math.random() * 400; v.push(0.6 * vn(A, x / 1.3, y / 1.3) + 0.4 * vn(B, x / 0.62 + 17.3, y / 0.62)) }
v.sort((a, b) => a - b)
const q = (c) => v[Math.min(v.length - 1, Math.floor(c * v.length))]
const mean = v.reduce((a, b) => a + b) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length)
console.log('mean', mean.toFixed(3), 'sd', sd.toFixed(3))
let best = [1e9]
for (let s = 0.05; s < 0.2; s += 0.002) { let e = 0; for (let c = 0.03; c < 0.98; c += 0.03) e += (0.5 + s * Math.log(c / (1 - c)) - q(c)) ** 2; if (e < best[0]) best = [e, s] }
console.log('logistic s', best[1].toFixed(3))
for (const c of [0.02, 0.05, 0.1, 0.25, 0.42, 0.55, 0.78, 0.9]) { const T = 0.5 + best[1] * Math.log(c / (1 - c)); let lo = 0, hi = v.length; while (lo < hi) { const m = (lo + hi) >> 1; if (v[m] < T) lo = m + 1; else hi = m } console.log('want', c, 'get', (lo / v.length).toFixed(3)) }
