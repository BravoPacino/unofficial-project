// 核对：把 src/data/sitePlan.js（以及 src/ink/site.js 算出来的世界，如果有）叠在手册第 5 页的总平面图上截图。
// 世界的数据先写到 /tmp/site-extra.json（一组 SVG 片段，平面图坐标）。手册的图不进仓库，从仓库外的路径传进来：
//   node tools/ink/site-overlay.cjs <brochure-p05.png> <out.png> [tx ty s]
// tx ty s：SVG 单位 → 手册图像素的平移和比例（默认是量好的那一组）。
const { chromium } = require('playwright'), fs = require('fs'), path = require('path')
;(async () => {
  const [img, out, tx = '99.9', ty = '362', sc = '2.033', only = ''] = process.argv.slice(2)   // only = 'world': just the world data
  const root = path.join(__dirname, '..', '..')
  const data = fs.readFileSync(path.join(root, 'src/data/sitePlan.js'), 'utf8').replace(/^[\s\S]*?export default /, '')
  const plan = JSON.parse(data)
  const extra = fs.existsSync('/tmp/site-extra.json') ? JSON.parse(fs.readFileSync('/tmp/site-extra.json', 'utf8')) : []
  const colors = {}, pal = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#9a6324', '#800000', '#000075', '#469990', '#808000']
  const col = (g) => (g ? (colors[g] ||= pal[Object.keys(colors).length % pal.length]) : '#222')
  let s = ''
  if (!only) for (const [x1, y1, x2, y2, g] of plan.lines) s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col(g)}" stroke-width="${g ? 1.6 : 0.8}"/>`
  if (!only) for (const p of plan.paths) s += `<path d="${p.d}" fill="none" stroke="${col(p.g)}" stroke-width="${p.g ? 1.6 : 0.8}"/>`
  if (!only) for (const [x, y, w, h, g] of plan.rects) if (w < 500) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${col(g)}" stroke-width="1.2"/>`
  for (const e of extra) s += e
  const labels = Object.entries(colors).map(([g, c]) => `<span style="color:${c}">■ ${g}</span>`).join(' ')
  const W = 1100, H = 1700
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const p = await b.newPage({ viewport: { width: W, height: H } })
  const bg = fs.readFileSync(img).toString('base64')
  await p.setContent(`<body style="margin:0;background:#fff;font:11px monospace">
    <div style="position:relative;width:${W}px;height:${H - 120}px;overflow:hidden">
      <img src="data:image/png;base64,${bg}" style="position:absolute;left:-60px;top:-330px;opacity:.55">
      <svg width="3308" height="2126" style="position:absolute;left:-60px;top:-330px" viewBox="0 0 3308 2126"><g transform="translate(${tx} ${ty}) scale(${sc})">${s}</g></svg>
    </div><div style="padding:6px;line-height:1.6">${labels}</div></body>`)
  await p.screenshot({ path: out }); await b.close(); console.log(out)
})()
