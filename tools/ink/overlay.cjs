// 叠图：把模型的轮廓画在宣传图中间那栋上，对不上的地方就是「不像」的地方。
//   node tools/ink/overlay.cjs <courtyard-homes.webp> <out.png>
// 宣传图不在这个分支里，也不要提交进来：
//   git show origin/main:public/images/courtyard-homes.webp > /tmp/ref-homes.webp
// 对齐方式：白框左右边 ↔ 图上 x = 172、668；框顶 ↔ y = 115（都是裁切放大后的像素，见 docs/ink-plan.md 附录 A）。
// 注意：下面的尺寸是写死的（2026-11 第一版模型的数），而且按正交画；模型改了、相机换成透视以后要跟着改，
// 最好改成直接读 src/ink/homes.js 的数、用同一个投影。
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os')
const CROP = { x: 600, y: 160, w: 420, h: 400, k: 2.4, W: 1600 }             // 原图 1600 × 682 里中间那栋
;(async () => {
  const [ref, out = 'overlay.png'] = process.argv.slice(2)
  if (!ref) { console.error('usage: node tools/ink/overlay.cjs <render.webp> <out.png>'); process.exit(1) }
  const L = -6, R = 6, FX0 = -5.4, FX1 = 2.3, Y0 = 3.9, Y1 = 10.6, T = 0.38, DIV = -0.25, MID = 7.2, TX0 = 3.2, TX1 = 4.5, CX0 = -5.7, CX1 = 6.4, G = 3.6
  const S = (668 - 172) / (FX1 - FX0), X = (x) => 172 + (x - FX0) * S, Y = (y) => 115 + (Y1 - y) * S
  const r = (x0, y0, x1, y1, c = '#ff6a00') => `<rect x="${X(x0)}" y="${Y(y1)}" width="${(x1 - x0) * S}" height="${(y1 - y0) * S}" fill="none" stroke="${c}" stroke-width="2.5"/>`
  const svg = [
    r(FX0, Y0, FX1, Y1), r(FX0 + T, Y0, DIV, MID - T / 2), r(FX0 + T, MID + T / 2, DIV, Y1 - T), r(DIV + T, Y0, FX1 - T, Y1 - T),   // 白框、两格阳台、木格栅
    r(TX0, G, TX1, Y1 - 0.1), r(TX0 - 0.3, Y0, TX0, Y1 + 1.2),                                                                    // 深色塔、白墙片
    r(CX0, G - 1.15, CX1, G, '#00c2ff'), r(CX0, G, CX1, G + 0.3, '#00c2ff'),                                                      // 木条带、楼板
    r(L, 0, R, G, '#ff00aa'),                                                                                                     // 一楼
  ].join('')
  const { x, y, w, h, k, W } = CROP, vw = Math.round(w * k), vh = Math.round(h * k) + 140
  const html = `<!doctype html><style>body{margin:0;background:#111}div{position:relative;width:${vw}px;height:${vh}px;overflow:hidden}
    i{position:absolute;left:0;top:0;width:${vw}px;height:${Math.round(h * k)}px;overflow:hidden;display:block}
    img{position:absolute;left:${-x * k}px;top:${-y * k}px;width:${W * k}px}svg{position:absolute;left:0;top:0;overflow:visible}</style>
    <div><i><img src="file://${path.resolve(ref)}"></i><svg width="${vw}" height="${vh}">${svg}</svg></div>`
  const f = path.join(os.tmpdir(), 'ink-overlay.html'); fs.writeFileSync(f, html)
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: vw, height: vh } })
  await p.goto('file://' + f); await p.waitForTimeout(400); await p.screenshot({ path: out }); await b.close()
  console.log(out, 'px/m', S.toFixed(1), 'ground y', Y(0).toFixed(0))
})()
