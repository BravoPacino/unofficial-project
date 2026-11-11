// 拍 hero 样片（docs/hero-plan.md）：平面图自己画出来（CSS 动画，逐帧拨到对应时刻），停一下，再从正上方滚到大门前。
// node tools/ink/film-hero.cjs <out.mp4> [W H] [fps]   需要先起开发服务器：npx vite --port 4390
// AT=2026-11-11T02:30:00Z 换一个时刻（默认 George Town 上午 10:30）
const { chromium } = require('playwright'), { execFileSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os')
;(async () => {
  const [out, W = '1280', H = '720', fps = '24'] = process.argv.slice(2), mobile = +W < 700
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'film-hero-')), F = +fps
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const p = await (await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile })).newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  const at = new Date(process.env.AT || '2026-11-11T02:30:00Z').getTime()
  await p.addInitScript((off) => { const Real = Date, now = () => Real.now() - off; window.Date = class extends Real { constructor(...a) { if (a.length) super(...a); else super(now()) } static now() { return now() } } }, Date.now() - at)
  await p.goto('http://localhost:4390/unofficial-project/sample.html?hero&film', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(400)
  let f = 0
  const shot = () => p.screenshot({ path: path.join(dir, `${String(f++).padStart(4, '0')}.png`) })
  // 1 · the plan drawing itself: every CSS animation paused and set to the frame's moment
  for (let i = 0; i < 3.2 * F; i++) {
    await p.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms }), (i / F) * 1000)
    await shot()
  }
  await p.evaluate(() => document.getAnimations().forEach((a) => { if (a.effect?.getTiming().iterations !== Infinity) a.finish() }))
  for (let i = 0; i < 0.8 * F; i++) await shot()
  // 2 · scrolling from the plan to the gate, the camera driven frame by frame
  const { total, gate } = await p.evaluate(() => { const f = document.querySelector('.take'), g = document.getElementById('stop-gate'); return { total: (f.offsetHeight - innerHeight) / innerHeight, gate: (g.getBoundingClientRect().top - f.getBoundingClientRect().top) / innerHeight } })
  const n = Math.round(9 * F), ease = (u) => u * u * (3 - 2 * u)
  for (let i = 0; i < n; i++) {
    const s = ease(i / (n - 1)) * gate
    for (let k = 0; k < 60 && !(await p.evaluate((t) => window.__film(t), s / total)); k++) await p.waitForTimeout(250)
    await shot()
  }
  for (let i = 0; i < 0.6 * F; i++) await shot()
  await b.close()
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', fps, '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', out])
  fs.rmSync(dir, { recursive: true })
  console.log(out, f, 'frames', JSON.stringify(errs.slice(0, 3)))
})()
