// Courtyard Homes for the ink stage: the middle house of the row in one-point perspective, a half of each neighbour.
// Proportions are read off the developer's published render with the white frame as the ruler (7.70 m wide);
// see docs/ink-plan.md, appendix A. Absolute sizes are not known. x runs along the street, y up, z towards the viewer;
// the front face of the white frame is the plane z = 0.
const WHITE = 0.97, DARK = 0.18, RECESS = 0.45, TIMBER = 0.76, METAL = 0.05, DECK = 0.9, SOFT = 0.62

// eye 1.7 m, 26 m back, camera on the middle of the house
export const VIEW = { cx: -0.2, cy: 6.4, width: 32, eye: 1.7, dist: 26, camX: -0.4 }
export const CARD_VIEW = { ...VIEW, cx: -0.4, cy: 6.85, width: 29 }        // a 2:1 box under about 900 px: less street
export const NARROW_VIEW = { ...VIEW, cx: -0.4, cy: 7.8, width: 21 }       // a squarer box, on a phone
export const PITCH = 15.5                      // one house to the next, along the row (estimated)
export const GROUND_Z = 2.8                    // front edge of the timber deck: where the ground line is drawn

// frame and bays
const FX0 = -5.4, FX1 = 2.3, Y0 = 4.92, Y1 = 12.27, TB = 0.37, DZ = 1.2
const BX0 = -5.04, BX1 = -0.03, SX0 = 0.35, SX1 = 1.9, M0 = 8.23, M1 = 8.62
// right-hand side: recessed wall, white fin, dark tower
const RW1 = 3.03, FIN1 = 3.39, FIN_TOP = 13.62, TW1 = 4.48, TW_TOP = 12.11
// ground floor, slab, hanging slats
const GX0 = -5.0, GL = [[-4.81, -1.24], [0.39, 3.96]], GY0 = 0.15, GY1 = 4.45, TRANSOM = 2.48, GZ = -0.25, ROOM = 5
const S0 = 4.55, CX0 = -5.4, CX1 = 6.6, CZ = 0.62

/** Rectangles tools/ink/overlay.cjs lays over the render: [x0, y0, x1, y1, z, group]. The bays are their openings in the frame face. */
export const OUTLINE = [
  [FX0, Y0, FX1, Y1, 0, 'frame'], [BX0, Y0, BX1, M0, 0, 'frame'], [BX0, M1, BX1, Y1 - TB, 0, 'frame'], [SX0, Y0, SX1, Y1 - TB, 0, 'frame'],
  [FIN1, Y0, TW1, TW_TOP, -0.3, 'frame'], [RW1, Y0, FIN1, FIN_TOP, -0.2, 'frame'],
  [CX0, S0, CX1, Y0, CZ + 0.08, 'slab'], [CX0, 3.23, CX1, S0, CZ, 'slab'],
  [GX0, 0, TW1, S0, 0, 'ground'], [GL[0][0], GY0, GL[0][1], GY1, GZ, 'ground'], [GL[1][0], GY0, GL[1][1], GY1, GZ, 'ground'],
]

/** Things worth pointing at (x, y, z). Text states only what the render shows. */
export const SPOTS = [
  { x: BX0 + 2.5, y: M1 + 2.1, z: -DZ, title: 'Recessed balconies', body: 'Two balconies, one above the other, set about a metre back inside a white frame, with sliding timber shutters either side of the glass.' },
  { x: (SX0 + SX1) / 2, y: Y0 + 2.2, z: -0.55, title: 'Timber screen', body: 'A full-height panel of upright timber fins beside the balconies, with glass behind it.' },
  { x: CX1 - 1.4, y: 3.9, z: CZ, title: 'Hanging slats', body: 'Horizontal timber slats hung from the edge of the first-floor slab, carried on past the end of the house.' },
  { x: GL[1][0] + 1.2, y: 1.4, z: GZ, title: 'Ground floor', body: 'Glazed full height either side of a white pier. In the render a stair and furniture show through the glass.' },
  { x: (FIN1 + TW1) / 2, y: 10.9, z: -0.3, title: 'Dark volume', body: 'A narrow dark block to one side with two small upright windows to the front.' },
]

/** One house. ox: offset along the row. faint: a neighbour, drawn a tone lighter and without the rooms behind its glass. */
function house(k, ox = 0, faint = false) {
  const tone = (a) => (faint ? 1 - (1 - a) * 0.15 : a)
  const weight = (l) => (!faint || !l || l === 'hair' ? l : 'soft')
  const box = (x, y, z, w, h, d, a = WHITE, o = {}) => k.box(x + ox, y, z, w, h, d, tone(a), { ...o, line: weight(o.line ?? 'main'), ...(faint ? { shade: false, flat: true } : {}) })
  const seg = (pairs, l = 'main') => k.seg(pairs.map(([p, q]) => [[p[0] + ox, p[1], p[2]], [q[0] + ox, q[1], q[2]]]), weight(l))
  const pane = (x0, y0, x1, y1, z, a0, a1) => k.pane(x0 + ox, y0, x1 + ox, y1, z, tone(a0), tone(a1))
  const heavy = { line: 'heavy' }, none = { line: false }, clean = { line: false, clean: true }
  const bar = (x0, y0, x1, y1, z, d = 0.07) => box((x0 + x1) / 2, (y0 + y1) / 2, z, x1 - x0, y1 - y0, d, METAL, none)

  // Glass set back into an opening: reveals all round, paper-white glass, mullions solid black.
  // cols: panes across; rows: heights of transoms; frame/mull: bar widths; room: a lit room behind instead of a pane.
  const glazing = (x0, y0, x1, y1, zf, depth, { cols = 1, rows = [], frame = 0.09, mull = 0.06, a0 = 1, a1 = 1, room = 0 } = {}) => {
    const zg = zf - depth, zm = zg + 0.04
    if (room) {
      // the room: back wall, side walls and floor, all clean; the slab or lintel above is its ceiling
      const lit = { ...clean, shade: false, cast: false, flat: true }        // a lit room: fixed tones, whatever the sun does
      box((x0 + x1) / 2, (y0 + y1) / 2, zg - room - 0.1, x1 - x0 + 0.4, y1 - y0 + 0.3, 0.2, 0.96, lit)
      for (const [a, b] of [[x0 - 0.2, x0], [x1, x1 + 0.2]]) box((a + b) / 2, (y0 + y1) / 2, zg - room / 2, b - a, y1 - y0 + 0.3, room, 0.9, lit)
      box((x0 + x1) / 2, y0 - 0.05, zg - room / 2, x1 - x0, 0.1, room, WHITE, lit)
      box((x0 + x1) / 2, y1 + 0.06, zg - room / 2, x1 - x0, 0.12, room, 0.78, lit)
    } else pane(x0, y0, x1, y1, zg, a0, a1)
    // reveals: the sides, head and sill of the opening, between the wall face and the glass
    if (depth > 0.02) {
      box(x0 - 0.02, (y0 + y1) / 2, zf - depth / 2, 0.04, y1 - y0, depth, WHITE, { line: 'soft' })
      box(x1 + 0.02, (y0 + y1) / 2, zf - depth / 2, 0.04, y1 - y0, depth, WHITE, { line: 'soft' })
      box((x0 + x1) / 2, y1 + 0.02, zf - depth / 2, x1 - x0 + 0.08, 0.04, depth, WHITE, { line: 'soft' })
    }
    bar(x0, y0, x1, y0 + frame, zm); bar(x0, y1 - frame, x1, y1, zm)
    bar(x0, y0, x0 + frame, y1, zm); bar(x1 - frame, y0, x1, y1, zm)
    for (let i = 1; i < cols; i++) { const u = x0 + ((x1 - x0) * i) / cols; bar(u - mull / 2, y0, u + mull / 2, y1, zm) }
    for (const r of rows) bar(x0, r - mull / 2, x1, r + mull / 2, zm)
  }

  // ── ground floor: two tall glazed bays either side of a white pier, the end walls, a room behind each bay
  const [[gl0, gl1], [gr0, gr1]] = GL
  box((GX0 + gl0) / 2, S0 / 2, -6, gl0 - GX0, S0, 12, WHITE, heavy)                     // left end wall
  box((gl1 + gr0) / 2, S0 / 2, -6, gr0 - gl1, S0, 12, WHITE, heavy)                     // pier
  box((gr1 + TW1) / 2, S0 / 2, -6, TW1 - gr1, S0, 12, WHITE, heavy)                     // right end wall
  box((GX0 + TW1) / 2, S0 / 2, -9, TW1 - GX0, S0, 7, WHITE, none)                        // the house beyond the rooms
  for (const [x0, x1] of GL) glazing(x0, GY0, x1, GY1, 0, -GZ, { cols: 4, rows: [TRANSOM], frame: 0.1, mull: 0.06, room: faint ? 0 : ROOM, a0: 0.9, a1: 1 })
  if (!faint) {
    const cl = { line: 'soft', clean: true, shade: false, cast: false, flat: true }, zr = GZ - ROOM
    // left room: a long low sofa, a side table, a tall cabinet against the back wall
    box(-3.4, 0.5, zr + 1.3, 2.2, 0.7, 0.9, 0.6, cl); box(-3.4, 0.95, zr + 0.95, 2.2, 0.3, 0.2, 0.6, cl)
    box(-1.95, 0.45, zr + 1.3, 0.45, 0.6, 0.45, 0.45, cl)
    box(-4.35, 1.4, zr + 0.25, 0.7, 2.5, 0.4, 0.5, cl)
    // right room: a straight stair rising to the left along the back wall, with a handrail
    const n = 15, run = 3.0, rise = GY1 - GY0
    for (let i = 0; i < n; i++) {
      const x = gr1 - 0.45 - ((i + 0.5) / n) * run, y = GY0 + ((i + 1) / n) * rise
      box(x, y - 0.06, zr + 0.55, run / n + 0.01, 0.12, 0.9, 0.52, cl)
    }
    seg([[[gr1 - 0.45, GY0 + 0.95, zr + 1.0], [gr1 - 0.45 - run, GY1 + 0.9, zr + 1.0]]], 'soft')
    box(gr0 + 0.9, 0.5, zr + 2.2, 1.0, 0.7, 0.8, 0.62, cl)                               // an armchair
    // a short screen of upright timber slats just inside each bay, to the right
    for (const sx of [gl1 - 0.62, gr1 - 0.62]) for (let u = sx; u < sx + 0.5; u += 0.1) box(u, (GY0 + 2.6) / 2, GZ - 0.35, 0.04, 2.6 - GY0, 0.08, 0.55, { line: 'hair', shade: false, cast: false, flat: true })
  }
  box((CX0 + CX1) / 2, 0.075, 0.6, CX1 - CX0, 0.15, 4.4, DECK)                          // timber deck

  // ── first-floor slab, thrown forward, with the band of slats hanging from its edge and carried on past the house
  box((CX0 + CX1) / 2, (S0 + Y0) / 2, -2.6, CX1 - CX0, Y0 - S0, 6.6, WHITE, heavy)
  for (let s = 0; s < 8; s++) {
    const y = S0 - 0.12 - s * 0.165
    box((CX0 + CX1) / 2, y, CZ, CX1 - CX0, 0.08, 0.08, TIMBER, none)
    seg([[[CX0, y - 0.04, CZ + 0.045], [CX1, y - 0.04, CZ + 0.045]]], 'soft')
  }
  seg([[[CX0, 3.23, CZ + 0.045], [CX0, S0, CZ + 0.045]], [[CX1, 3.23, CZ + 0.045], [CX1, S0, CZ + 0.045]]])
  for (let u = CX0 + 0.05; u < CX1; u += 1.45) bar(u, 3.23, u + 0.05, S0, CZ + 0.06, 0.04)

  // ── upper two floors: the white frame standing DZ proud of the wall behind it
  box((FX0 + FX1) / 2, (Y0 + Y1) / 2, -DZ - 5, FX1 - FX0, Y1 - Y0, 10, WHITE)
  const fr = (x0, x1, y0, y1) => box((x0 + x1) / 2, (y0 + y1) / 2, -DZ / 2, x1 - x0, y1 - y0, DZ, WHITE, heavy)
  fr(FX0, BX0, Y0, Y1); fr(SX1, FX1, Y0, Y1); fr(BX1, SX0, Y0, Y1)
  fr(FX0, FX1, Y1 - TB, Y1); fr(BX0, BX1, M0, M1)
  const zb = -DZ
  for (const [b0, b1] of [[Y0, M0], [M1, Y1 - TB]]) {
    // sliding shutters of horizontal timber slats either side, glass doors between
    for (const [s0, s1] of [[BX0 + 0.08, BX0 + 1.4], [BX1 - 1.4, BX1 - 0.08]]) {
      box((s0 + s1) / 2, (b0 + b1) / 2, zb + 0.06, s1 - s0, b1 - b0 - 0.08, 0.06, TIMBER)
      for (let y = b0 + 0.2; y < b1 - 0.12; y += 0.17) seg([[[s0, y, zb + 0.1], [s1, y, zb + 0.1]]], 'hair')
    }
    glazing(BX0 + 1.5, b0 + 0.02, BX1 - 1.5, b1 - 0.3, zb + 0.1, 0.06, { cols: 2, frame: 0.08, mull: 0.07 })
    // railing: black rails with close upright bars
    const zr = -0.3
    bar(BX0, b0 + 1.07, BX1, b0 + 1.13, zr, 0.05); bar(BX0, b0 + 0.1, BX1, b0 + 0.14, zr, 0.04)
    for (let u = BX0 + 0.12; u < BX1; u += 0.14) seg([[[u, b0 + 0.12, zr], [u, b0 + 1.1, zr]]], 'hair')
  }
  // timber screen bay: glass behind, darker low down where it shows the room, upright fins in front
  glazing(SX0 + 0.02, Y0 + 0.02, SX1 - 0.02, Y1 - TB - 0.02, zb + 0.08, 0.04, { cols: 1, rows: [M0 + 0.2], frame: 0.06, a0: 0.7, a1: 1 })
  for (let u = SX0 + 0.12; u < SX1 - 0.05; u += 0.19) {
    box(u, (Y0 + Y1 - TB) / 2, -0.55, 0.07, Y1 - TB - Y0, 0.22, TIMBER, none)
    seg([[[u + 0.035, Y0, -0.44], [u + 0.035, Y1 - TB, -0.44]]], 'soft')
  }

  // ── to the right: recessed wall, the thin white fin rising past the roof, the dark tower with two small windows
  box((FX1 + RW1) / 2, (Y0 + TW_TOP) / 2, -1.6 - 4, RW1 - FX1, TW_TOP - Y0, 8, RECESS)
  box((RW1 + FIN1) / 2, (Y0 + FIN_TOP) / 2, -0.2 - 1.4, FIN1 - RW1, FIN_TOP - Y0, 2.8, WHITE, heavy)
  box((FIN1 + TW1) / 2, (Y0 + TW_TOP) / 2, -0.3 - 5, TW1 - FIN1, TW_TOP - Y0, 10, DARK, heavy)
  for (const wy of [5.93, 9.27]) glazing(3.5, wy, 3.92, wy + 1.08, -0.18, 0.1, { frame: 0.05 })
  // ── top left: the party wall behind the frame, rising a little above it
  box(-5.1, (Y0 + 12.95) / 2, -1.3 - 5, 0.38, 12.95 - Y0, 10, RECESS)
}

export default function homes(k) {
  house(k, -PITCH, true)
  house(k, PITCH, true)
  house(k, 0)
}
