// node shot.cjs <out.png> [W H] [fakeTimeISO] [hoverX hoverY]：打开样板页截图；可以把页面里的时间固定到某一刻（看不同日照）
const { chromium } = require('playwright')
;(async () => {
  const [out, W = '1440', H = '900', iso = '', hx = '', hy = ''] = process.argv.slice(2)
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2, isMobile: +W < 700, hasTouch: +W < 700 })
  const p = await ctx.newPage(), errs = []
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)))
  if (iso) await p.addInitScript((ms) => { const D = Date, off = ms - D.now(); Date.now = () => D.prototype.getTime.call(new D()) + off; const RD = D; window.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now()) } static now() { return RD.prototype.getTime.call(new RD()) + off } } }, new Date(iso).getTime())
  await p.goto('http://localhost:4390/unofficial-project/sample.html' + (process.env.Q || ''), { waitUntil: 'networkidle' })
  await p.waitForTimeout(2500)
  if (hx) { await p.mouse.move(+hx, +hy); await p.waitForTimeout(500) }
  await p.screenshot({ path: out })
  console.log(out, JSON.stringify(errs.slice(0, 5)))
  await b.close()
})()
