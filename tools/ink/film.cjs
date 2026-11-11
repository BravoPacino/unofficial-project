// 把「一镜到底」样片一帧一帧拍下来，再用 ffmpeg 接成视频（软件渲染太慢，直接录屏会一卡一卡的）。
// node tools/ink/film.cjs <out.mp4> [W H] [seconds] [fps]   需要先起开发服务器：npx vite --port 4390
// PAGE=… 换样板页（默认 take：照总平面图走的一镜到底）；AT=2026-11-09T08:30:00Z 换一个时刻（默认 George Town 上午 10:30）
const { chromium } = require('playwright'), { execFileSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os')
;(async () => {
  const [out, W = '1280', H = '720', secs = '12', fps = '24'] = process.argv.slice(2)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'film-')), n = Math.round(+secs * +fps)
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.addInitScript((ms) => { const RD = Date, off = ms - RD.now(); window.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off) } static now() { return RD.now() + off } } }, new Date(process.env.AT || '2026-11-09T02:30:00Z').getTime())
  await p.goto('http://localhost:4390/unofficial-project/sample.html?' + (process.env.PAGE || 'take') + '&film', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
  // an even scroll that only eases in and out at the very ends (each stop already slows down by itself)
  const ease = (u) => { const e = 0.06; return u < e ? (u * u) / (2 * e * (1 - e)) : u > 1 - e ? 1 - ((1 - u) * (1 - u)) / (2 * e * (1 - e)) : (u - e / 2) / (1 - e) }
  for (let f = 0; f < n; f++) {
    const t = ease(f / (n - 1))
    for (let k = 0; k < 40 && !(await p.evaluate((t) => window.__film(t), t)); k++) await p.waitForTimeout(250)   // next stop still being built
    await p.screenshot({ path: path.join(dir, `${String(f).padStart(4, '0')}.png`) })
  }
  await b.close()
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', fps, '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', out])
  fs.rmSync(dir, { recursive: true })
  console.log(out, n, 'frames', JSON.stringify(errs.slice(0, 3)))
})()
