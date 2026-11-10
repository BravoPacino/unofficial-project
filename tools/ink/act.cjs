// 互动（样板页 sample.html）：拖动改时间 → 松手回实时 → 键盘 → 点热点；各拍一张，并读 HUD 文字
// node tools/ink/act.cjs [W H tag]
const { chromium } = require('playwright')
;(async () => {
  const [W = '1440', H = '900', tag = 'd'] = process.argv.slice(2), mobile = +W < 700
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile })
  const p = await ctx.newPage(), errs = []
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)))
  await p.addInitScript((ms) => { const RD = Date, off = ms - RD.now(); window.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off) } static now() { return RD.now() + off } } }, new Date('2026-11-09T02:30:00Z').getTime())
  await p.goto('http://localhost:4390/unofficial-project/sample.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
  const hud = () => p.evaluate(() => document.querySelector('.ink-hud')?.innerText.replace(/\s+/g, ' '))
  const box = await p.evaluate(() => { const r = document.querySelector('.ink').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
  const out = { size: box, live: await hud() }
  if (!mobile) {
    await p.mouse.move(box.x + box.w * 0.72, box.y + box.h * 0.3); await p.waitForTimeout(500); await p.screenshot({ path: tag + '-hover.png' })
    await p.mouse.down(); await p.mouse.move(box.x + box.w * 0.95, box.y + box.h * 0.32, { steps: 10 }); await p.waitForTimeout(400)
    out.dragged = await hud(); await p.screenshot({ path: tag + '-drag.png' })
    await p.mouse.up(); await p.waitForTimeout(3200); out.afterRelease = await hud()
    await p.focus('.ink'); for (let i = 0; i < 6; i++) await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300); out.keys = await hud(); await p.screenshot({ path: tag + '-keys.png' })
    await p.evaluate(() => document.activeElement.blur()); await p.waitForTimeout(3000)
  }
  const spot = p.locator('.ink-spot').first(); mobile ? await spot.tap() : await spot.click(); await p.waitForTimeout(400)
  out.card = await p.evaluate(() => document.querySelector('.ink-card')?.innerText.replace(/\s+/g, ' ').slice(0, 90)); await p.screenshot({ path: tag + '-card.png' })
  out.overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  await p.screenshot({ path: tag + '-full.png', fullPage: true })
  console.log(JSON.stringify(out), JSON.stringify(errs.slice(0, 4))); await b.close()
})()
