// 一路滚完整个页面，记下 GPU 上同时占着多少内存（纹理 + 渲染缓冲 + 每个 WebGL 画布的绘图缓冲）和多少个 WebGL 上下文。
// node tools/ink/gpu-budget.cjs [W H] [url]   手机上一页超过几百 MB 就会被系统杀掉（页面闪退重载）。
const { chromium } = require('playwright')
;(async () => {
  const [W = '390', H = '844', url = 'http://localhost:4390/unofficial-project/'] = process.argv.slice(2), mobile = +W < 700
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: mobile ? 3 : 2, isMobile: mobile, hasTouch: mobile })
  const p = await ctx.newPage(), errs = []
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/Invalid DOM property/.test(m.text()) && errs.push(m.text().slice(0, 120)))
  await p.addInitScript(() => {
    const live = new Map(), bpp = { 6408: 4, 32856: 4, 6402: 4, 33190: 4, 33189: 2, 35056: 4, 36012: 4, 34842: 8, 34836: 16, 33326: 4, 33328: 8 }
    let ctxs = 0, peak = 0, bound = new WeakMap()
    const size = () => { let s = 0; for (const v of live.values()) s += v; return s }
    window.__gpu = () => ({ mb: Math.round(size() / 1048576), peak: Math.round(peak / 1048576), ctxs })
    const note = () => { peak = Math.max(peak, size()) }
    for (const G of [WebGL2RenderingContext, WebGLRenderingContext]) {
      const P = G.prototype, cur = new WeakMap()
      const wrap = (name, fn) => { const o = P[name]; P[name] = function (...a) { const r = o.apply(this, a); fn.call(this, a, r); return r } }
      wrap('bindTexture', function ([, t]) { cur.set(this, t) })
      wrap('deleteTexture', function ([t]) { live.delete(t) })
      wrap('texImage2D', function (a) { const t = cur.get(this); if (t && typeof a[3] === 'number' && a[1] === 0) { live.set(t, a[3] * a[4] * (bpp[a[2]] || 4)); note() } })
      wrap('texStorage2D', function (a) { const t = cur.get(this); if (t) { live.set(t, a[3] * a[4] * (bpp[a[2]] || 4) * (a[1] > 1 ? 1.34 : 1)); note() } })
      wrap('bindRenderbuffer', function ([, r]) { bound.set(this, r) })
      wrap('deleteRenderbuffer', function ([r]) { live.delete(r) })
      wrap('renderbufferStorage', function (a) { const r = bound.get(this); if (r) { live.set(r, a[2] * a[3] * (bpp[a[1]] || 4)); note() } })
      if (P.renderbufferStorageMultisample) wrap('renderbufferStorageMultisample', function (a) { const r = bound.get(this); if (r) { live.set(r, Math.max(1, a[1]) * a[3] * a[4] * (bpp[a[2]] || 4)); note() } })
    }
    const gc = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { const r = gc.call(this, t, ...a); if (r && /webgl/.test(t) && !this.__counted) { this.__counted = true; ctxs++ } return r }
  })
  await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(6000)
  const H2 = await p.evaluate(() => document.documentElement.scrollHeight), out = []
  for (let y = 0; y < H2; y += +H * 0.7) {
    await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(1500)
    const g = await p.evaluate(() => window.__gpu()); out.push(g.mb)
  }
  const fin = await p.evaluate(() => window.__gpu())
  console.log(JSON.stringify({ W, steps: out.length, liveMB: out.join(' '), peakMB: fin.peak, webglContexts: fin.ctxs }), JSON.stringify(errs.slice(0, 3)))
  await b.close()
})()
