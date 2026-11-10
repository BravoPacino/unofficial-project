// 给网站出一张静态后备图（WebGL 起不来时显示）：node tools/ink/still.cjs <homes|villas> <out.jpg>
// 需要先起开发服务器：npx vite --port 4390
const { chromium } = require('playwright')
;(async () => {
  const [model = 'homes', out] = process.argv.slice(2)
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const p = await b.newPage({ viewport: { width: 1032, height: 900 }, deviceScaleFactor: 2 })
  await p.addInitScript((ms) => { const RD = Date, off = ms - RD.now(); window.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off) } static now() { return RD.now() + off } } }, new Date('2026-11-09T02:30:00Z').getTime())
  await p.goto(`http://localhost:4390/unofficial-project/sample.html?${model}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
  await p.addStyleTag({ content: '.ink-hud,.ink-spot{display:none!important}' }); await p.waitForTimeout(300)
  await p.locator('.ink').screenshot({ path: out, type: 'jpeg', quality: 82 })
  console.log(out); await b.close()
})()
