// 手机：真的触摸拖动（CDP 发触摸事件）→ 看时间有没有变；再点热点
const { chromium } = require('playwright')
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  const p = await ctx.newPage(), errs = []
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)))
  await p.addInitScript((ms) => { const RD = Date, off = ms - RD.now(); window.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off) } static now() { return RD.now() + off } } }, new Date('2026-11-09T02:30:00Z').getTime())
  await p.goto('http://localhost:4390/unofficial-project/sample.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
  const hud = () => p.evaluate(() => document.querySelector('.ink-hud')?.innerText.replace(/\s+/g, ' '))
  const r = await p.evaluate(() => { const r = document.querySelector('.ink').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
  const out = { box: r, live: await hud() }
  await p.screenshot({ path: 'm-live.png' })
  const cdp = await ctx.newCDPSession(p), T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  const y = r.y + r.h * 0.3
  await T('touchStart', r.x + r.w * 0.3, y); for (let i = 1; i <= 10; i++) { await T('touchMove', r.x + r.w * (0.3 + 0.04 * i), y + i * 0.4); await p.waitForTimeout(30) }
  await p.waitForTimeout(400); out.dragged = await hud(); await p.screenshot({ path: 'm-drag.png' })
  await T('touchEnd'); await p.waitForTimeout(3200); out.after = await hud()
  // 竖着划 = 页面滚动，不该改时间
  const y0 = await p.evaluate(() => scrollY)
  await T('touchStart', r.x + r.w * 0.5, r.y + r.h * 0.7); for (let i = 1; i <= 10; i++) { await T('touchMove', r.x + r.w * 0.5 + i * 0.3, r.y + r.h * 0.7 - i * 22); await p.waitForTimeout(30) }
  await T('touchEnd'); await p.waitForTimeout(600); out.scrolled = (await p.evaluate(() => scrollY)) - y0; out.afterScroll = await hud()
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300)
  await p.locator('.ink-spot').nth(1).tap(); await p.waitForTimeout(400)
  out.card = await p.evaluate(() => { const c = document.querySelector('.ink-card'), r = c.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), vw: innerWidth, text: c.innerText.slice(0, 30) } })
  await p.screenshot({ path: 'm-card.png' })
  out.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log(JSON.stringify(out), JSON.stringify(errs.slice(0, 4))); await b.close()
})()
