// Courtyard Villas for the ink stage: square-on, like Courtyard Homes, so the two cards read as one set of drawings.
// One villa drawn in full in the middle of the row, the ones either side lighter. The facade is read off the
// developer's render (the same reading as villaRow in tools/drawings/scenes/villas.js, a module 9.6 "render units"
// wide); the brochure gives each home as 8.4 m wide, so everything is scaled by S to metres. Heights are not in the
// brochure: they follow the render at the same scale. The render is an oblique view, so these are more estimated than
// the Homes drawing, which could be laid over a square-on render.
// x runs along the row, y up, z towards the viewer; the ground-floor wall face is the plane z = 0.
const WHITE = 0.97, TIMBER = 0.62, FINS = 0.5, METAL = 0.05, DECK = 0.9

const S = 8.4 / 9.6                              // render units → metres
const P = 9.6                                    // one module, render units
const sv = (v) => ({ ...v, eye: 1.7, dist: 26 * 0.926, camX: 0 })
// the same camera as Courtyard Homes: eye 1.7 m, about 24 m back
export const VIEW = sv({ cx: 0, cy: 6.5, width: 31.5 })
export const CARD_VIEW = sv({ cx: 0, cy: 6.9, width: 28.5 })
export const NARROW_VIEW = sv({ cx: 0, cy: 7.6, width: 21 })
export const PITCH = 8.4                         // one home to the next: the brochure's width
export const GROUND_Z = 2.95                     // front edge of the planters: where the ground line is drawn
export const TREES = [{ x: -8.2, z: 3.6, h: 8.4, seed: 31 }, { x: 8.6, z: 3.8, h: 8.0, seed: 44 }]   // in front of the neighbours, framing the middle one
export const OUTLINE = []                        // no square-on render to lay it over

const G = 3.4, B = 3.75, TOP = 13.6              // ground floor, band, roof (render units)
const C0 = 1.1, C1 = 5.1, CY0 = 6.7, CY1 = 10.1, CZ = 0.7, CT = 0.3   // the projecting white box frame
const P0 = 5.6, P1 = 9.2, PY0 = 6.2, PY1 = 14.6, PZ = 0.4, PT = 0.25  // the timber-fin panel

/** Things worth pointing at (metres). Text states only what the render shows. */
export const SPOTS = [
  { x: ((C0 + C1) / 2 - P / 2) * S, y: (CY0 + CY1) / 2 * S, z: CZ * S, title: 'Box frame', body: 'A white frame stands out from the wall around the upper window, lined with timber on its inner side.' },
  { x: ((P0 + P1) / 2 - P / 2) * S, y: 10 * S, z: PZ * S, title: 'Timber fins', body: 'A tall panel of upright timber fins in a thin white frame, rising a little above the roof line.' },
  { x: ((C0 + C1) / 2 - P / 2) * S, y: 11.2 * S, z: -0.4 * S, title: 'Top-floor balcony', body: 'Above the box frame, a balcony set back into the wall behind a black railing.' },
  { x: (1.75 - P / 2) * S, y: 1.4 * S, z: 0.9 * S, title: 'Front door', body: 'Each home has its own entrance under a white portal, beside a wide glazed front. In the brochure each villa is 8.4 m wide, with its own courtyard.' },
]

/** One villa module. m: its place along the row (0 = the middle one). faint: a neighbour, drawn a tone lighter. */
function villa(k, m, faint) {
  const tone = (a) => (faint ? 1 - (1 - a) * 0.06 : a)
  // the neighbours: every line faint; the middle villa: every edge a step heavier, so the eye stays on it
  const STEP = { soft: 'main', main: 'heavy', heavy: 'heavy', hair: 'hair' }
  const weight = (l) => (!l ? l : faint ? 'ghost' : STEP[l])
  const ox = m * P - P / 2                       // the module's left edge, render units, with module 0 centred on x = 0
  const box = (x, y, z, w, h, d, a = WHITE, o = {}) => k.box((x + ox) * S, y * S, z * S, w * S, h * S, d * S, tone(a), { ...o, line: weight(o.line ?? 'main'), ...(faint ? { shade: false, flat: true } : {}) })
  const seg = (pairs, l = 'main') => k.seg(pairs.map(([p, q]) => [[(p[0] + ox) * S, p[1] * S, p[2] * S], [(q[0] + ox) * S, q[1] * S, q[2] * S]]), weight(l))
  const none = { line: false }, heavy = { line: 'heavy' }
  const bar = (x0, y0, x1, y1, z, d = 0.07) => box((x0 + x1) / 2, (y0 + y1) / 2, z, x1 - x0, y1 - y0, d, METAL, none)
  // a wall face with openings cut in it: cells around the holes (no seams drawn), the outline in ink, a room behind each hole
  const wall = (x0, x1, y0, y1, zf, depth, holes, a = WHITE, l = 'heavy') => {
    const xs = [...new Set([x0, x1, ...holes.flatMap((q) => [q[0], q[2]])])].sort((p, q) => p - q)
    const ys = [...new Set([y0, y1, ...holes.flatMap((q) => [q[1], q[3]])])].sort((p, q) => p - q)
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2
      if (holes.some((q) => cx > q[0] && cx < q[2] && cy > q[1] && cy < q[3])) continue
      box(cx, cy, zf - depth / 2, xs[i + 1] - xs[i], ys[j + 1] - ys[j], depth, a, { line: false })
    }
    seg([[[x0, y0, zf], [x1, y0, zf]], [[x1, y0, zf], [x1, y1, zf]], [[x1, y1, zf], [x0, y1, zf]], [[x0, y1, zf], [x0, y0, zf]]], l)
    // what is seen through the glass: a lit room, fixed tones whatever the sun does
    for (const [hx0, hy0, hx1, hy1] of holes) {
      const lit = { line: false, shade: false, cast: false, flat: true }
      box((hx0 + hx1) / 2, (hy0 + hy1) / 2, zf - 3.2, hx1 - hx0 + 0.4, hy1 - hy0 + 0.4, 0.2, 0.95, lit)
      box((hx0 + hx1) / 2, hy1 + 0.1, zf - 1.7, hx1 - hx0 + 0.4, 0.2, 3, 0.72, lit)
      box((hx0 + hx1) / 2, hy0 - 0.1, zf - 1.7, hx1 - hx0 + 0.4, 0.2, 3, 0.97, lit)
      for (const sx of [hx0 - 0.1, hx1 + 0.1]) box(sx, (hy0 + hy1) / 2, zf - 1.7, 0.2, hy1 - hy0 + 0.4, 3, 0.86, lit)
    }
  }
  // glass set back in its opening: reveals, frame and mullions solid black. The glass itself is left out: clear glass
  // shows the lit room behind it, which reads as glass far better than a white sheet.
  const glazing = (x0, y0, x1, y1, zf, depth, cols = 1, rows = []) => {
    const zg = zf - depth, zm = zg + 0.04
    if (depth > 0.02) for (const [a, b] of [[x0 - 0.04, x0], [x1, x1 + 0.04]]) box((a + b) / 2, (y0 + y1) / 2, zf - depth / 2, b - a, y1 - y0, depth, WHITE, { line: 'soft' })
    if (depth > 0.02) box((x0 + x1) / 2, y1 + 0.02, zf - depth / 2, x1 - x0 + 0.08, 0.04, depth, WHITE, { line: 'soft' })
    bar(x0, y0, x1, y0 + 0.09, zm); bar(x0, y1 - 0.09, x1, y1, zm); bar(x0, y0, x0 + 0.09, y1, zm); bar(x1 - 0.09, y0, x1, y1, zm)
    for (let i = 1; i < cols; i++) { const u = x0 + ((x1 - x0) * i) / cols; bar(u - 0.03, y0, u + 0.03, y1, zm) }
    for (const r of rows) bar(x0, r - 0.03, x1, r + 0.03, zm)
  }

  // ── the walls: ground floor, the band above it, the upper floors set back 0.8, the parapet
  const GL = [3.0, 0.12, 7.8, G - 0.3], L1 = [1.2, B + 0.15, 5.0, B + 2.55]
  const BOXW = [C0 + CT + 0.15, CY0 + CT + 0.1, C1 - CT - 0.15, CY1 - CT - 0.1], TOPW = [C0 + 0.4, 10.66, C1 - 0.4, 13.2]
  wall(0, P, 0, G, 0, 0.5, [GL])
  box(P / 2, (G + B) / 2, 0.15, P, B - G, 0.3, WHITE, heavy)
  wall(0, P, B, TOP, -0.8, 0.5, [L1, BOXW, TOPW], WHITE, 'main')
  box(P / 2, TOP + 0.25, -0.95, P, 0.5, 0.3, WHITE, heavy)

  // ── ground floor: a wide glazed front, the white door portal, a small louvred window
  glazing(...GL, 0, 0.2, 4, [2.3])
  box(1.0, 1.5, 0.45, 0.28, 3.0, 0.9); box(2.5, 1.5, 0.45, 0.28, 3.0, 0.9); box(1.75, 3.0 - 0.14, 0.45, 1.78, 0.28, 0.9, WHITE, heavy)
  box(1.75, 1.36, -0.05, 1.22, 2.6, 0.1, TIMBER)                                   // the door, timber
  for (let u = 1.3; u < 2.3; u += 0.12) seg([[[u, 0.15, 0.01], [u, 2.6, 0.01]]], 'hair')
  box(1.75, 0.1, 1.3, 1.9, 0.2, 0.8, DECK)                                          // step
  box(8.7, 1.65, 0.02, 1.0, 2.1, 0.04, TIMBER)
  for (let y = 0.75; y < 2.6; y += 0.13) seg([[[8.2, y, 0.05], [9.2, y, 0.05]]], 'hair')
  // front yard: low walls either side of the door, a planter in front
  box(0.35, 0.5, 1.6, 0.7, 1.0, 0.3); box(6.0, 0.5, 1.6, 6.4, 1.0, 0.3)
  box(6.0, 0.25, 2.3, 6.4, 0.5, 1.1, DECK)

  // ── first floor: glazing and a narrow screen of timber slats beside it
  glazing(...L1, -0.8, 0.12, 3)
  box(0.65, B + 1.5, -0.72, 0.7, 2.8, 0.06, TIMBER)
  for (let u = 0.3; u < 1.0; u += 0.12) seg([[[u, B + 0.1, -0.68], [u, B + 2.9, -0.68]]], 'hair')

  // ── the box frame standing out from the wall, timber lining on its inner left side, a window inside
  const fr = (a0, a1, b0, b1) => box((a0 + a1) / 2, (b0 + b1) / 2, (CZ - 0.8) / 2, a1 - a0, b1 - b0, CZ + 0.8, WHITE, heavy)
  fr(C0, C0 + CT, CY0, CY1); fr(C1 - CT, C1, CY0, CY1); fr(C0, C1, CY1 - CT, CY1); fr(C0 - 0.2, C1 + 0.2, CY0, CY0 + CT)
  box(C1 - CT - 0.03, (CY0 + CY1) / 2, (CZ - 0.8) / 2, 0.06, CY1 - CY0 - 2 * CT, CZ + 0.78, TIMBER, { line: 'soft' })
  box((C0 + C1) / 2, CY1 - CT - 0.03, (CZ - 0.8) / 2, C1 - C0 - 2 * CT, 0.06, CZ + 0.78, TIMBER, { line: 'soft' })
  glazing(...BOXW, -0.8, 0.1, 2)

  // ── top floor: a balcony set back into the wall, black railing, glass behind
  box((C0 + C1) / 2, 10.6, -0.4, C1 - C0, 0.12, 0.8, WHITE)                        // balcony floor
  glazing(...TOPW, -0.8, 0.1, 2)
  bar(C0, 11.6, C1, 11.66, -0.06, 0.05); bar(C0, 10.7, C1, 10.74, -0.06, 0.04)
  for (let u = C0 + 0.1; u < C1; u += 0.14) seg([[[u, 10.7, -0.06], [u, 11.65, -0.06]]], 'hair')

  // ── the panel of timber fins in a thin white frame, from the first floor to above the roof
  const pf = (a0, a1, b0, b1) => box((a0 + a1) / 2, (b0 + b1) / 2, (PZ - 0.8) / 2, a1 - a0, b1 - b0, PZ + 0.8, WHITE, heavy)
  pf(P0, P0 + PT, PY0, PY1); pf(P1 - PT, P1, PY0, PY1); pf(P0, P1, PY1 - PT, PY1); pf(P0, P1, PY0, PY0 + PT)
  box((P0 + P1) / 2, (PY0 + PY1) / 2, -0.7, P1 - P0 - 2 * PT, PY1 - PY0 - 2 * PT, 0.1, 0.42, none)   // dark behind the fins
  for (let u = P0 + PT + 0.08; u < P1 - PT - 0.04; u += 0.15) box(u, (PY0 + PY1) / 2, PZ - 0.3, 0.06, PY1 - PY0 - 2 * PT, 0.16, FINS, { line: 'hair' })
}

export default function villas(k) {
  for (const m of [-2, -1, 1, 2]) villa(k, m, true)
  villa(k, 0, false)
}
