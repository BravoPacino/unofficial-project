// 叠图：把模型的轮廓（homes.js 的 OUTLINE，经同一个透视投影）画在宣传图中间那栋上，对不上的地方就是「不像」的地方。
//   node tools/ink/overlay.cjs <courtyard-homes.webp> <out.png>
// 宣传图不在这个分支里，也不要提交进来：
//   git show origin/main:public/images/courtyard-homes.webp > /tmp/ref-homes.webp
// 对齐：白框（z = 0 平面）左右边 ↔ 裁切图上 x = 172、668，框顶 ↔ y = 115（见 docs/ink-plan.md 附录 A）。
// 白框在 z = 0，所以只有它不受相机影响；凹进去、凸出来的东西按我们的相机投到这个平面上再比。
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os'); const { pathToFileURL } = require('url')
const CROP = { x: 600, y: 160, w: 420, h: 400, k: 2.4, W: 1600 }             // 原图 1600 × 682 里中间那栋
const COL = { frame: '#ff6a00', slab: '#00c2ff', ground: '#ff00aa' }
;(async () => {
  const [ref, out = 'overlay.png'] = process.argv.slice(2)
  if (!ref) { console.error('usage: node tools/ink/overlay.cjs <render.webp> <out.png>'); process.exit(1) }
  const src = path.resolve(__dirname, '../../src/ink')
  const { toPlane } = await import(pathToFileURL(path.join(src, 'project.js')))
  const { VIEW, OUTLINE } = await import(pathToFileURL(path.join(src, 'homes.js')))
  const [fx0, , fx1, fy1] = OUTLINE[0], S = (668 - 172) / (fx1 - fx0)
  const P = (x, y, z) => { const [X, Y] = toPlane(VIEW, x, y, z); return [172 + (X - fx0) * S, 115 + (fy1 - Y) * S] }
  const svg = OUTLINE.map(([x0, y0, x1, y1, z, c]) => {
    const [a, b] = P(x0, y1, z), [cc, d] = P(x1, y0, z)
    return `<rect x="${a}" y="${b}" width="${cc - a}" height="${d - b}" fill="none" stroke="${COL[c]}" stroke-width="2.5"/>`
  }).join('')
  const { x, y, w, h, k, W } = CROP, vw = Math.round(w * k), vh = Math.round(h * k)
  const html = `<!doctype html><style>body{margin:0;background:#111}div{position:relative;width:${vw}px;height:${vh}px;overflow:hidden}
    img{position:absolute;left:${-x * k}px;top:${-y * k}px;width:${W * k}px}svg{position:absolute;left:0;top:0;overflow:visible}</style>
    <div><img src="file://${path.resolve(ref)}"><svg width="${vw}" height="${vh}">${svg}</svg></div>`
  const f = path.join(os.tmpdir(), 'ink-overlay.html'); fs.writeFileSync(f, html)
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: vw, height: vh } })
  await p.goto('file://' + f); await p.waitForTimeout(400); await p.screenshot({ path: out }); await b.close()
  console.log(out, 'px/m', S.toFixed(1), 'deck front y', P(0, 0, 2.8)[1].toFixed(0), 'frame-plane ground y', P(0, 0, 0)[1].toFixed(0))
})()
