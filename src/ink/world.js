// The one take's world: the eight drawn places set side by side along x, every one still looking the way it was traced
// (towards −z), so one sun lights them all as their own drawings are lit, and the camera tracks along from one to the
// next. What lies between them is not in the developer's material: it is drawn here as an imagined garden walk — a
// paved path between low hedges, a row of villas behind a strip of trees — and the page says so while it is on screen.
// The place footprints (metres, measured off the scenes): aerial x −27…21, pool −28…28, walkway −97…76, Courtyard
// Homes −18…19, Villas −21…21, gym −24…24, lounge −48…21, entrance −40…26. Each sits 50 m clear of the next.
import { villaRow } from '../../tools/drawings/scenes/villas.js'

export const GAP = 50
// x of each place's origin, in STOPS order (route.js), and its footprint along x
export const PLACES = [
  { x: 0, x0: -27, x1: 21 },       // aerial
  { x: 100, x0: -28, x1: 28 },     // pool
  { x: 275, x0: -97, x1: 76 },     // walkway
  { x: 420, x0: -18, x1: 19 },     // Courtyard Homes
  { x: 510, x0: -21, x1: 21 },     // Courtyard Villas
  { x: 605, x0: -24, x1: 24 },     // gym
  { x: 727, x0: -48, x1: 21 },     // lounge
  { x: 838, x0: -40, x1: 26 },     // entrance
]
/** the clear strip of world between place i and place i + 1: [a, b] in x */
export const gapOf = (i) => [PLACES[i].x + PLACES[i].x1, PLACES[i + 1].x + PLACES[i + 1].x0]

/** The imagined walk across one gap, a…b (k: an adapted kit, drawing in world x from 0 = a). */
export function walk(k, len) {
  const { seg, slabShape, tree, box } = k
  const Z0 = 26, Z1 = 30                                                    // the path, across the line of travel
  // paving: long planks along the path, a few joints across
  const planks = []
  for (let z = Z0 + 0.5; z < Z1; z += 0.5) planks.push([[0, 0.01, z], [len, 0.01, z]])
  for (let x = 1.8; x < len; x += 3.6) planks.push([[x, 0.01, Z0], [x, 0.01, Z1]])
  seg(planks, 'hair')
  seg([[[0, 0.01, Z0], [len, 0.01, Z0]], [[0, 0.01, Z1], [len, 0.01, Z1]]])
  // low hedges either side
  for (const [z0, z1] of [[Z0 - 1.6, Z0 - 0.6], [Z1 + 0.6, Z1 + 1.6]]) slabShape([[0.5, z0], [len - 0.5, z0], [len - 0.5, z1], [0.5, z1]], 0, 0.7, true, 0.86)
  // a strip of trees well back from the path (a tree near the moving camera is a black trunk across the picture)
  for (let x = 6, i = 0; x < len - 4; x += 13, i++) tree(x, 6 + (i % 2) * 5, 8.5 + (i % 3), 3, i * 7 + Math.round(len))
  // a row of villas facing the walk
  const n = Math.floor((len - 6) / 8.4)
  if (n > 0) villaRow(k, { n, ox: (len - n * 8.4) / 2, oz: -6, ry: 0, ground: false, yard: true })
  // a garden wall closing the row's ends
  box(1, 0.6, -2, 0.3, 1.2, 8); box(len - 1, 0.6, -2, 0.3, 1.2, 8)
}
