// 整页从头滚到底拍成视频：页面的部分照常滚，一镜到底那段用 __film 一帧一帧画（软件渲染太慢，直接录屏会一卡一卡的）。
// node tools/ink/film-page.cjs <out.mp4> [W H] [seconds] [fps]   需要先起开发服务器：npx vite --port 4390
const { chromium } = require('playwright'), { execFileSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os')
;(async () => {
  const [out, W = '1280', H = '720', secs = '34', fps = '24'] = process.argv.slice(2), mobile = +W < 700
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'film-')), n = Math.round(+secs * +fps)
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const p = await (await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile })).newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.goto('http://localhost:4390/unofficial-project/?film', { waitUntil: 'networkidle' }); await p.waitForTimeout(6000)
  const { end, f0, f1 } = await p.evaluate(() => { const f = document.querySelector('.take, .flight'); return { end: document.documentElement.scrollHeight - innerHeight, f0: f.offsetTop, f1: f.offsetTop + f.offsetHeight - innerHeight } })
  const ease = (u) => { const e = 0.04; return u < e ? (u * u) / (2 * e * (1 - e)) : u > 1 - e ? 1 - ((1 - u) * (1 - u)) / (2 * e * (1 - e)) : (u - e / 2) / (1 - e) }
  const settle = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60)))))
  for (let f = 0; f < n; f++) {
    const y = Math.round(ease(f / (n - 1)) * end)
    await p.evaluate((y) => window.scrollTo(0, y), y)
    await settle()
    if (y >= f0 && y <= f1) for (let k = 0; k < 40 && !(await p.evaluate((t) => window.__film(t), (y - f0) / (f1 - f0))); k++) await p.waitForTimeout(250)
    else await p.waitForTimeout(120)
    await p.screenshot({ path: path.join(dir, `${String(f).padStart(4, '0')}.png`) })
  }
  await b.close()
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', fps, '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', out])
  fs.rmSync(dir, { recursive: true })
  console.log(out, n, 'frames', JSON.stringify(errs.slice(0, 3)))
})()
