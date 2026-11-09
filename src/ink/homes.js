// Courtyard Homes, one house in front elevation, for the ink stage.
// Massing follows the developer's published render (the same reading as tools/drawings/scenes/homes.js);
// every size is estimated from that render, in metres. x runs along the street, y up, z towards the viewer.
const WHITE = 0.97, NAVY = 0.46, TIMBER = 0.93, METAL = 0.05, DECK = 0.94

export const VIEW = { cx: 0.2, cy: 5.9, width: 32 }
export const G = 3.6
const L = -6, R = 6
const FX0 = L + 0.6, FX1 = FX0 + 7.7, Y0 = G + 0.3, Y1 = Y0 + 6.7, T = 0.38, DZ = 1.2
const DIV = FX0 + 5.15, MID = Y0 + 3.3
const TX0 = FX1 + 0.9, TX1 = TX0 + 1.3
const CX0 = L + 0.3, CX1 = R + 0.4, CZ = 1.12

/** Levels and edges the drawing sheet draws its extension lines from */
export const GUIDES = { xs: [L, FX0, DIV + T / 2, FX1, TX1, CX1], ys: [0, G, MID, Y1, Y1 + 1.2] }
/** Things worth pointing at. Text states only what the render shows. */
export const SPOTS = [
  { x: FX0 + 2.6, y: MID + 2.2, title: 'Recessed balconies', body: 'Two balconies, one above the other, set about a metre back inside a white frame. The frame is what throws the long shadow across them.' },
  { x: DIV + T + 0.85, y: Y0 + 2.1, title: 'Timber screen', body: 'A full-height panel of upright timber fins beside the balconies, running from the first floor to the roof line.' },
  { x: L + 2.6, y: G - 0.75, title: 'Hanging slats', body: 'A band of horizontal timber slats hung from the edge of the first-floor slab. It drops just below the head of the ground-floor glazing.' },
  { x: (TX0 + TX1) / 2, y: MID + 2.9, title: 'Dark volume', body: 'A narrow dark block to one side with two small upright windows to the front.' },
]

export default function homes(k) {
  const { box, pane, veil, seg, rect } = k
  const heavy = { line: 'heavy' }, none = { line: false }

  // ── ground floor: the widest part, glazed either side of a white pier, on a timber deck
  box(0, G / 2, -7, R - L, G, 14, WHITE, heavy)
  const gz = 0.03, gy0 = 0.18, gy1 = G - 0.35
  for (const [x0, x1] of [[L + 0.5, L + 4.7], [L + 6.3, R - 0.9]]) {
    pane(x0, gy0, x1, gy1, gz, 0.97, 0.78)
    for (const y of [gy0, gy1]) box((x0 + x1) / 2, y, gz + 0.03, x1 - x0 + 0.09, 0.09, 0.08, METAL, none)
    for (let i = 0; i <= 4; i++) box(x0 + ((x1 - x0) * i) / 4, (gy0 + gy1) / 2, gz + 0.03, 0.09, gy1 - gy0, 0.08, METAL, none)
    seg([[[x0, 2.55, gz + 0.08], [x1, 2.55, gz + 0.08]]])
    veil(x0, gy0, x1, gy1, gz + 0.12, 1, 0.72)
  }
  // the right-hand end of the ground floor: a short screen of upright slats
  for (let u = R - 0.78; u < R - 0.12; u += 0.11) seg([[[u, 0.2, 0.01], [u, G - 0.4, 0.01]]], 'hair')
  box(0, 0.08, 1.4, R - L, 0.16, 2.8, DECK)

  // ── first-floor slab edge, thrown forward, with the band of slats hanging from it
  box((CX0 + CX1) / 2, G + 0.15, 0.3, CX1 - CX0, 0.3, 1.7, WHITE, heavy)
  for (let s = 0; s < 8; s++) {                                       // light bars; one line on the underside of each
    const y = G - 0.1 - s * 0.15
    box((CX0 + CX1) / 2, y, CZ, CX1 - CX0, 0.07, 0.07, TIMBER, none)
    seg([[[CX0, y - 0.035, CZ + 0.04], [CX1, y - 0.035, CZ + 0.04]]], 'soft')
  }
  seg([[[CX0, G - 1.15, CZ + 0.04], [CX0, G, CZ + 0.04]], [[CX1, G - 1.15, CZ + 0.04], [CX1, G, CZ + 0.04]]])
  for (let u = CX0 + 0.05; u < CX1; u += 1.45) box(u, G - 0.6, CZ + 0.05, 0.05, 1.2, 0.04, METAL, none)

  // ── upper two floors: wall behind, white frame standing 1.2 m proud of it
  box((FX0 + FX1) / 2, (Y0 + Y1) / 2, -DZ - 5, FX1 - FX0, Y1 - Y0, 10, WHITE)
  const fr = (x0, x1, y0, y1) => box((x0 + x1) / 2, (y0 + y1) / 2, -DZ / 2, x1 - x0, y1 - y0, DZ, WHITE, heavy)
  fr(FX0, FX0 + T, Y0, Y1); fr(FX1 - T, FX1, Y0, Y1); fr(DIV, DIV + T, Y0, Y1)
  fr(FX0, FX1, Y1 - T, Y1); fr(FX0 + T, DIV, MID - T / 2, MID + T / 2)
  const bx0 = FX0 + T, bx1 = DIV, zb = -DZ + 0.02
  for (const [b0, b1] of [[Y0, MID - T / 2], [MID + T / 2, Y1 - T]]) {
    // sliding shutters of horizontal slats either side, glass doors between
    for (const [s0, s1] of [[bx0 + 0.1, bx0 + 1.35], [bx1 - 1.25, bx1 - 0.1]]) {
      box((s0 + s1) / 2, (b0 + b1) / 2 - 0.02, zb + 0.03, s1 - s0, b1 - b0 - 0.15, 0.06, TIMBER)
      for (let y = b0 + 0.22; y < b1 - 0.15; y += 0.19) seg([[[s0, y, zb + 0.07], [s1, y, zb + 0.07]]], 'hair')
    }
    const d0 = bx0 + 1.5, d1 = bx1 - 1.4, dt = b1 - 0.35
    pane(d0, b0 + 0.05, d1, dt, zb + 0.01, 0.97, 0.82)
    for (const u of [d0, (d0 + d1) / 2 + 0.05, d1]) box(u, (b0 + 0.05 + dt) / 2, zb + 0.04, 0.07, dt - b0 - 0.05, 0.06, METAL, none)
    box((d0 + d1) / 2, dt, zb + 0.04, d1 - d0 + 0.07, 0.07, 0.06, METAL, none)
    veil(bx0, b0, bx1, b1, zb + 0.1, 1, 0.7)                          // darker towards the soffit
    // railing: black rails with close upright bars
    const zr = -0.3
    box((bx0 + bx1) / 2, b0 + 1.1, zr, bx1 - bx0, 0.06, 0.05, METAL, none); box((bx0 + bx1) / 2, b0 + 0.12, zr, bx1 - bx0, 0.04, 0.04, METAL, none)
    for (let u = bx0 + 0.12; u < bx1; u += 0.14) seg([[[u, b0 + 0.12, zr], [u, b0 + 1.1, zr]]], 'hair')
  }
  // timber screen to the right of the balconies
  for (let u = DIV + T + 0.12; u < FX1 - T - 0.05; u += 0.2) {        // light fins against the shade behind; one line down the far side
    box(u, (Y0 + Y1 - T) / 2, -0.55, 0.08, Y1 - T - Y0, 0.24, TIMBER, none)
    seg([[[u + 0.04, Y0, -0.42], [u + 0.04, Y1 - T, -0.42]]], 'soft')
  }
  veil(DIV + T, Y0, FX1 - T, Y1 - T, -DZ + 0.1, 0.78, 0.6)

  // ── to the right: a recessed dark wall, the narrow dark volume, a thin white wall rising past the roof
  const YT = Y1 - 0.1
  box((FX1 + TX0) / 2, (G + YT) / 2, -1.6 - 4.8, TX0 - FX1, YT - G, 9.6, NAVY)
  box((TX0 + TX1) / 2, (G + YT) / 2, -0.3 - 5.45, TX1 - TX0, YT - G, 10.9, NAVY, heavy)
  veil(FX1, G + 0.3, TX1, YT, -0.25, 1.12, 0.84)                      // the dark paint, lighter towards the ground
  for (const wy of [Y0 + 1.1, MID + 1.1]) {
    pane(TX0 + 0.42, wy, TX0 + 0.88, wy + 1.15, -0.28, 0.97, 0.85)
    rect(TX0 + 0.42, wy, TX0 + 0.88, wy + 1.15, -0.27)
  }
  box(TX0 - 0.15, (Y0 + Y1 + 1.2) / 2, -0.2 - 3, 0.3, Y1 + 1.2 - Y0, 6, WHITE, heavy)
  // ── top left: the party wall behind the frame, a little higher than it
  box(FX0 + 0.45, (G + Y1 + 0.7) / 2, -1.3 - 5.5, 0.3, Y1 + 0.7 - G, 11, NAVY)

  // ── front garden: two low planter walls with a gap between
  box(L + 2.9, 0.3, 5.3, 5.4, 0.6, 0.9, WHITE); box(R - 2.3, 0.3, 5.3, 4.2, 0.6, 0.9, WHITE)
}
