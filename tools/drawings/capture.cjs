// 出图：node tools/drawings/capture.cjs <scene> <palette> <out.webp> [w h]
// 需要先在仓库根目录跑：npx vite tools/drawings --port 4350
const { chromium } = require('playwright')
const fs = require('fs')
;(async () => {
  const [scene, palette = 'gold', out, w = '1600', h = '1000'] = process.argv.slice(2)
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const p = await b.newPage({ viewport: { width: +w, height: +h } })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  await p.goto(`http://localhost:4350/?scene=${scene}&palette=${palette}&w=${w}&h=${h}`)
  await p.waitForFunction(() => window.__ready, null, { timeout: 120000 })
  const data = await p.evaluate((out) => document.getElementById('c').toDataURL(out.endsWith('.png') ? 'image/png' : 'image/webp', 0.9), out)
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'))
  console.log(out, fs.statSync(out).size, errs.length ? errs : '')
  await b.close()
})()
