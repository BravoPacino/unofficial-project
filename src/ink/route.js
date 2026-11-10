// The one take (docs/animation-plan.md): the stops the camera passes through, in order, and what is said at each.
// path: camera keys { eye, at, fov, shift? } — fov vertical at a 16:9 box; shift slides the frustum as a square-on
// elevation does — passed through in order as the stop's share of the scroll goes by. dwell: the point on the path the
// light is worked out for (and roughly where the camera slows). keep: on a tall phone screen, the share of the 16:9
// horizontal angle kept. Notes: p, a point in the scene; [a, b], when on the path they show; dx/dy, where the label
// sits from the point (CSS px), m: the same on a phone (otherwise a smaller dx/dy); a label sits above the point when dy < 0,
// below it otherwise. Every word is the site's own copy (from the brochure); sizes in the drawings are estimated.
import { VIEW as HOMES_VIEW } from './homes'
import { VIEW as VILLAS_VIEW } from './villas'

// the camera of a square-on drawing (homes.js / villas.js) as a key: straight on, the frustum slid up to frame it
const square = (v, back = 0) => {
  const x = v.camX ?? v.cx, dist = v.dist + back, tanH = v.width / 2 / v.dist
  return { eye: [x, v.eye, dist], at: [x, v.eye, 0], shift: [(v.cx - x) / dist, (v.cy - v.eye) / dist], fov: (2 * Math.atan(tanH / (16 / 9)) * 180) / Math.PI }
}

export const STOPS = [
  {
    id: 'about', scene: 'aerial', len: 2.0, dwell: 0.6, shadow: { x: 0, z: -24, r: 56 },
    path: [
      { eye: [-6, 50, 52], at: [-1, -2, -20], fov: 44 },
      { eye: [-4.5, 38, 42], at: [-1.5, -4, -24], fov: 46 },
      { eye: [-3.5, 22, 26], at: [-1.5, -3, -30], fov: 48 },
      { eye: [-1.5, 10, 14], at: [0, 0.5, -30], fov: 50 },
    ],
    notes: [
      { p: [-1, 0, 6], a: 0.18, b: 0.56, dx: 90, dy: -110, title: '239 homes on 12 acres', text: 'A low-density, gated and guarded enclave in George Town, completing in 2028.' },
      { p: [2.5, 0, -41], a: 0.5, b: 0.9, dx: -120, dy: -90, title: 'Courtyards first', text: 'Courtyard-themed layouts, inspired by George Town’s heritage, bring daylight and cross-ventilation into every home.' },
    ],
  },
  {
    id: 'facilities', scene: 'pool', len: 1.8, dwell: 0.5, shadow: { x: 0, z: -10, r: 46 },
    path: [
      { eye: [5, 9, 46], at: [0.5, 1.5, -12], fov: 34 },
      { eye: [3.6, 4.5, 36], at: [0, 3, -16], fov: 30 },
      { eye: [2.6, 1.9, 25], at: [-0.5, 4.2, -20], fov: 26 },
      { eye: [1.6, 1.5, 15], at: [-1, 3.6, -22], fov: 28 },
    ],
    notes: [
      { p: [-4, 0.1, 6], a: 0.28, b: 0.8, dx: -40, dy: -150, title: 'Resort-style pool', text: 'Lounge decks look out over resort-style pools, with a floating gym and courtyards in between.' },
    ],
  },
  {
    scene: 'walkway', len: 2.0, dwell: 0.5, shadow: { x: 2, z: 4, r: 30 },
    path: [
      { eye: [-12, 15, 34], at: [6, -1.5, -10], fov: 34 },
      { eye: [-8.2, 8.9, 21.2], at: [7.8, -1.35, -8.6], fov: 30 },
      { eye: [-6, 6.2, 12], at: [8, -2.2, -16], fov: 32 },
      { eye: [-3.5, 4.2, 3], at: [6, -2.6, -26], fov: 36 },
    ],
    notes: [
      { p: [-2.5, 1.3, 4.5], a: 0.18, b: 0.58, dx: -70, dy: -140, title: 'Pedestrian bridges', text: 'Paths and pedestrian bridges thread through the gardens.' },
      { p: [6.2, -2.0, -10], a: 0.5, b: 0.92, dx: 80, dy: -130, title: '4–6 parking lots per home', text: 'Rare on land-scarce Penang Island, and planned for several generations under one roof.' },
    ],
  },
  {
    id: 'residences', model: 'homes', len: 2.0, dwell: 0.62, keep: 0.45, light: 'square', shadow: { x: 0, z: -4, r: 22 },
    path: [
      { eye: [-12, 7, 32], at: [-0.4, 5.2, 0], fov: 36 },
      { eye: [-5, 3.2, 27], at: [-0.4, 4.2, 0], fov: 37, shift: [0, 0.06] },
      square(HOMES_VIEW, 1.5),
      square(HOMES_VIEW),
    ],
    notes: [
      { p: [-3.6, 11.4, 0.3], a: 0.5, b: 0.97, dx: -70, dy: -40, title: 'Courtyard Homes', text: '4-storey zero-lot bungalows · 32 units · 6 bedrooms, 7 bathrooms · 5+1 parking · from RM 8.1M' },
      { p: [3.2, 2.2, 1.2], a: 0.58, b: 0.97, dx: 90, dy: -40, m: { dx: -20, dy: 150 }, title: 'On a slope', text: 'Upper floors 9.15 m wide on a plot 12.8 m wide. The car porch is at street level, the garden a floor up. A lift in every home.' },
    ],
  },
  {
    model: 'villas', len: 2.0, dwell: 0.62, keep: 0.45, light: 'square', shadow: { x: 0, z: -4, r: 22 },
    path: [
      { eye: [-12, 6, 32], at: [0, 5.4, 0], fov: 36 },                          // in from the left: the take runs along +x
      { eye: [-5, 3, 27], at: [0, 4.6, 0], fov: 38, shift: [0, 0.07] },
      square(VILLAS_VIEW, 1.5),
      square(VILLAS_VIEW),
    ],
    notes: [
      { p: [-3, 10.9, 0.3], a: 0.5, b: 0.97, dx: -70, dy: -40, m: { dx: -10, dy: -24 }, title: 'Courtyard Villas', text: '1.5 & 2-storey condominium · 207 units · 4–6 bedrooms · 4 parking · from RM 3.3M' },
      { p: [2.6, 2, 1.2], a: 0.58, b: 0.97, dx: 90, dy: -40, m: { dx: -20, dy: 150 }, title: 'Each 8.4 m wide', text: 'Two kinds: 2-storey with 6 bedrooms, and 1.5-storey with 4 bedrooms, each with its own courtyard.' },
    ],
  },
  {
    scene: 'gym', len: 1.5, dwell: 0.5, shadow: { x: 0, z: 4, r: 14 },
    path: [
      { eye: [0.3, 2.6, 9.7], at: [0.3, 2.0, -10], fov: 50 },
      { eye: [0.3, 1.72, 9.4], at: [0.3, 2.3, -10], fov: 46 },
      { eye: [0.3, 1.8, 7.2], at: [0.3, 2.2, -10], fov: 44 },
    ],
    notes: [
      { p: [0.735, 1.3, 3.3], a: 0.3, b: 0.85, dx: 90, dy: -150, title: 'Floating gym', text: 'A glass pavilion looking out over the pool.' },
    ],
  },
  {
    scene: 'lounge', len: 1.5, dwell: 0.5, shadow: { x: 0, z: 2, r: 16 },
    path: [
      { eye: [2.5, 3.4, 13], at: [0.6, 0.8, -2], fov: 42 },
      { eye: [1.0, 1.95, 8.6], at: [0.9, 1.0, -2], fov: 50 },
      { eye: [0.6, 1.8, 6.4], at: [0.8, 0.9, -3], fov: 50 },
    ],
    notes: [
      { p: [-1.5, 0.8, 1.5], a: 0.3, b: 0.85, dx: -80, dy: -150, title: 'Lounge decks', text: 'Lounge decks look out over resort-style pools.' },
    ],
  },
  {
    id: 'enquire', scene: 'entrance', len: 2.0, dwell: 0.5, form: 0.5, shadow: { x: 0, z: -6, r: 22 },
    path: [
      { eye: [-17, 2.4, 22], at: [1, 5, -4], fov: 46 },
      { eye: [-13.5, 1.6, 16], at: [1.5, 5.2, -4], fov: 50 },
      { eye: [-14.5, 1.8, 18], at: [1.5, 5.2, -4], fov: 52, shift: [0.42, 0.02] },   // slid over: the entrance to the left, room for the form
      { eye: [-14.5, 1.8, 18], at: [1.5, 5.2, -4], fov: 52, shift: [0.42, 0.02] },
    ],
    notes: [
      { p: [-3, 3, -6], a: 0.12, b: 0.48, dx: -60, dy: -140, title: 'Gated and guarded', text: 'A guard house at the entrance, under the portal.' },
    ],
  },
]
