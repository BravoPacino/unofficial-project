// The one take laid out on the masterplan (docs/world-plan.md §2.3): the camera's keys in world metres (site.js: x east,
// y up, z south; the pool valley floor is y = 0, the gate and street 6.8, the walkway level 13.6). dt: screens of scroll
// from the key before. id: a name for notes and nav links to point at. keep: on a tall phone screen, the share of the
// 16:9 width kept. Every word of the notes is the site's own copy (from the brochure) or the plan's own legend; own:
// a facility with no published image, drawn in our own hand (marked ○ on the page).
import { VIEW as HOMES_VIEW } from './homes'
import { VIEW as VILLAS_VIEW } from './villas'
import { PLOTS } from './site'
import { GATE } from './places'

// a drawing placed in the world: its origin and its turn about the vertical; local → world
const placed = ([ox, oy, oz], ry) => ([x, y, z]) => [ox + x * Math.cos(ry) + z * Math.sin(ry), oy + y, oz - x * Math.sin(ry) + z * Math.cos(ry)]
// the camera of a square-on drawing (homes.js / villas.js), straight on with the frustum slid up to frame it, in the world
const square = (v, to, { back = 0, dist = v.dist, width = v.width } = {}) => {
  const x = v.camX ?? v.cx, d = dist + back, tanH = width / 2 / dist
  return { eye: to([x, v.eye, d]), at: to([x, v.eye, 0]), shift: [(v.cx - x) / d, (v.cy - v.eye) / d], fov: (2 * Math.atan(tanH / (16 / 9)) * 180) / Math.PI, keep: 0.45 }
}

// ── the two homes the take ends at: a Courtyard Home on the west row (its garden side faces west, out of the site), and
//    the Courtyard Villa next row over, its pool side facing east across the valley's south end (over the lawn)
const homePlot = PLOTS.find((p) => p.row === 'homes' && p.z0 < 37 && p.z1 > 37)
const hz = (homePlot.z0 + homePlot.z1) / 2
export const HOME = { at: [homePlot.x0 + 3, 6.8, hz], ry: -Math.PI / 2, plots: (p) => p.row === 'homes' && Math.abs((p.z0 + p.z1) / 2 - hz) < 14 }
const villaPlot = PLOTS.filter((p) => p.row === 'westRow' && p.z0 > 40).sort((a, b) => a.z0 - b.z0)[4]
const vz = (villaPlot.z0 + villaPlot.z1) / 2
export const VILLA = { at: [-13.5, 0, vz], ry: Math.PI / 2, plots: (p) => p.row === 'westRow' && Math.abs((p.z0 + p.z1) / 2 - vz) < 10 }
const toHome = placed(HOME.at, HOME.ry), toVilla = placed(VILLA.at, VILLA.ry)
const toGate = placed([GATE.x, GATE.y, GATE.z], 0)

export const KEYS = [
  // 0 · the plan from straight above, tipping up into the estate, down to the street in front of the gate
  { id: 'plan', eye: [-12, 330, 26], at: [-12, 0, 6], fov: 50, keep: 0.62 },
  { eye: [-40, 170, 300], at: [-10, 0, 40], fov: 44, dt: 1.2 },
  { eye: [-18, 30, 215], at: [-10, 9, 115], fov: 46, dt: 1.0 },
  { id: 'gate', eye: toGate([-13.5, 1.6, 16]), at: toGate([1.5, 5.2, -4]), fov: 52, dt: 0.9 },
  { eye: toGate([-9.5, 1.7, 11]), at: toGate([3.5, 5.0, -6]), fov: 52, dt: 0.7 },
  // 1 · up the podium's face, over its edge onto the deck garden, east along it
  { eye: [-14, 12, 140], at: [-8, 13.5, 110], fov: 50, dt: 0.7 },
  { eye: [-8, 17.8, 124], at: [12, 14.5, 100], fov: 52, dt: 0.7 },
  { id: 'podium', eye: [20, 16.4, 109], at: [46, 14, 80], fov: 52, dt: 0.8 },
  // 2 · into the east drive: the walkway along each edge, the road a floor below with a garage door per home, a bridge
  { eye: [46.6, 16.4, 72], at: [46.6, 12, 22], fov: 50, dt: 0.8 },
  { id: 'bridge', eye: [44.5, 15.7, 32], at: [50, 10.6, -6], fov: 52, dt: 0.7 },
  { eye: [46.6, 15.6, 8], at: [46.6, 12, -40], fov: 50, dt: 0.7 },
  // 3 · along the walkway level to the north end: the track, the fitness zones, the bridges; west along the top
  { id: 'track', eye: [46.6, 15.5, -48], at: [46.6, 13.6, -100], fov: 50, dt: 1.0 },
  { eye: [43, 15.8, -101], at: [10, 13.4, -112], fov: 52, dt: 0.9 },
  { eye: [12, 16.4, -112.5], at: [-4, 9, -100], fov: 52, dt: 0.7 },
  // 4 · on the walkway at the valley's north end, then down in front of the planted wall
  { id: 'wall', eye: [-4.3, 19.5, -116], at: [-4.0, -2, -66], fov: 54, dt: 0.7 },
  { eye: [-4.3, 11.5, -105], at: [-4.0, 4, -55], fov: 52, dt: 0.9 },
  { eye: [-4.2, 4.2, -101], at: [-3.6, 1.8, -55], fov: 52, dt: 0.7 },
  // 5 · along the water: the lounge deck (D), turning to it, then on down the pool past the island
  { eye: [-6.8, 2.0, -95], at: [-1, 0.6, -70], fov: 52, dt: 0.6 },
  { id: 'lounge', eye: [-8.2, 1.9, -88.5], at: [1.2, 0.5, -78.5], fov: 54, dt: 0.6 },
  { eye: [-7.6, 1.9, -85.5], at: [1.8, 0.4, -78.5], fov: 54, dt: 0.7 },
  { eye: [-5.2, 1.8, -74], at: [-3.4, 1.4, -32], fov: 46, dt: 0.7 },
  { id: 'pool', eye: [-4.6, 1.7, -62], at: [-4.2, 1.6, -22], fov: 44, dt: 0.8 },
  // 6 · into the floating gym through its glass, behind the four treadmills, out high through the far side
  { eye: [-4.45, 1.9, -40], at: [-4.45, 1.9, -10], fov: 48, dt: 0.8 },
  { eye: [-4.45, 1.75, -29.5], at: [-4.45, 2.2, 0], fov: 50, dt: 0.6 },
  { id: 'gym', eye: [-4.45, 1.72, -28.2], at: [-4.45, 2.1, 0], fov: 50, dt: 0.7 },
  { eye: [-3.8, 3.9, -17.4], at: [-3.6, 1.6, 15], fov: 50, dt: 0.5 },               // the changing room, sauna and studio fill
  { eye: [-3.6, 6.4, -12.5], at: [-3.6, 0.4, 24], fov: 52, dt: 0.5 },               // the valley floor here: over their roofs
  { eye: [-3.6, 8.2, -2], at: [-3.8, 0.2, 36], fov: 52, dt: 0.7 },
  // 7 · rising over the spa pools: the splash pool's ship and the treehouse ahead, as the brochure's aerial has them
  { id: 'splash', eye: [-3.6, 16, 16], at: [-3.4, 0, 60], fov: 50, dt: 0.8 },
  { eye: [-4, 20, 24], at: [-4, 0, 64], fov: 50, dt: 0.7 },
  // 8 · out west over the villas, the road and the Homes' roofs; round, and down to a Courtyard Home's garden side
  { eye: [-40, 27, hz + 2], at: [-90, 8, hz], fov: 50, dt: 0.9 },
  { eye: [-78, 26, hz - 4], at: [-118, 10, hz], fov: 50, dt: 0.7 },
  { eye: [-114, 15, hz - 10], at: [-88, 10, hz], fov: 48, dt: 0.8 },
  { ...square(HOMES_VIEW, toHome, { back: 2.5 }), dt: 0.8 },
  { ...square(HOMES_VIEW, toHome), id: 'homes', dt: 0.6 },
  { ...square(HOMES_VIEW, toHome), dt: 1.0 },
  // 9 · up again and back over the next row east, down into the valley's south end, round to face a Courtyard Villa
  { eye: [-100, 22, hz + 6], at: [-40, 8, vz - 6], fov: 50, dt: 0.8 },
  { eye: [-40, 27, vz - 8], at: [0, 2, vz], fov: 50, dt: 0.8 },
  { eye: [2, 13, vz - 3], at: [-13.5, 5, vz], fov: 50, dt: 0.8 },
  { ...square(VILLAS_VIEW, toVilla, { back: 2, dist: 17, width: 20 }), dt: 0.8 },
  { ...square(VILLAS_VIEW, toVilla, { dist: 17, width: 20 }), id: 'villas', dt: 0.7 },
  { ...square(VILLAS_VIEW, toVilla, { dist: 17, width: 20 }), id: 'end', dt: 1.6 },
]

// notes: from / to name keys (with an offset in screens); p: a world point
export const NOTES = [
  { from: ['plan', 0.2], to: ['gate', -0.6], p: [-4, 14, -10], dx: 120, dy: -90, title: '239 homes on 12 acres', text: 'A low-density, gated and guarded enclave in George Town, completing in 2028.' },
  { from: ['gate', -0.3], to: ['gate', 0.9], p: toGate([4.6, 4, -5.5]), dx: 90, dy: -120, title: 'Gated and guarded', text: 'A · Guard House, under the portal at the gate.' },
  { from: ['podium', -0.6], to: ['podium', 0.5], p: [33.5, 16, 119], dx: 60, dy: -110, title: 'F · Observation Pavilion', text: '', own: true },
  { from: ['bridge', -0.3], to: ['bridge', 0.8], p: [47, 14.2, 13], dx: -90, dy: -120, title: 'I · Pedestrian Bridges', text: 'Paths and pedestrian bridges thread through the gardens.' },
  { from: ['bridge', 0.1], to: ['bridge', 1.0], p: [38, 11.6, -9], dx: 80, dy: 120, m: { dx: 20, dy: 140 }, title: '4–6 parking lots per home', text: 'Rare on land-scarce Penang Island, and planned for several generations under one roof.' },
  { from: ['track', -0.5], to: ['track', 0.6], p: [44.4, 13.7, -70], dx: -80, dy: -110, title: 'H · Multipurpose Track · G · Fitness Zone', text: '', own: true },
  { from: ['wall', 0.2], to: ['wall', 1.3], p: [-5.6, 9, -107.2], dx: 70, dy: -40, title: 'A · Verdant Green Wall', text: '', own: true },
  { from: ['lounge', -0.4], to: ['lounge', 0.8], p: [0.4, 0.8, -79], dx: -90, dy: -120, title: 'D · Lounge Decks', text: 'Lounge decks look out over resort-style pools.' },
  { from: ['lounge', -0.3], to: ['lounge', 0.8], p: [-11.5, 0.6, -74], dx: 40, dy: -170, title: 'E · Aqua Gym', text: '', own: true },
  { from: ['pool', -0.8], to: ['pool', 0.4], p: [0.2, 0.5, -51], dx: 60, dy: -130, title: 'G · Swimming Pool', text: 'Lounge decks look out over resort-style pools, with a floating gym and courtyards in between.' },
  { from: ['pool', -0.4], to: ['pool', 0.7], p: [-8.8, 1.6, -42], dx: -40, dy: -110, title: 'J · Poolside Cabanas', text: '' },
  { from: ['gym', -0.8], to: ['gym', 0.3], p: [-4.45, 1.3, -21.6], dx: 90, dy: -150, title: 'K · Floating Gym', text: '' },
  { from: ['gym', 0.4], to: ['gym', 1.2], p: [-7.4, 3.4, -11], dx: -50, dy: -60, title: 'L · Changing Room · M · Sauna', text: '', own: true },
  { from: ['gym', 0.8], to: ['gym', 1.6], p: [-3.5, 3.9, 1.5], dx: 70, dy: -50, title: 'N · Fitness Studio', text: '', own: true },
  { from: ['splash', -0.4], to: ['splash', 0.8], p: [-4.1, 2.5, 52], dx: -100, dy: -60, title: 'Q · Kids’ Splash Pool', text: '' },
  { from: ['splash', -0.2], to: ['splash', 0.9], p: [-3.9, 4.5, 62], dx: 90, dy: -70, title: 'R · Kids’ Adventure Treehouse', text: '' },
  { from: ['homes', -0.5], to: ['homes', 1.4], p: toHome([-3.6, 11.4, 0.3]), dx: -70, dy: -40, title: 'Courtyard Homes', text: '4-storey zero-lot bungalows · 32 units · 6 bedrooms, 7 bathrooms · 5+1 parking · from RM 8.1M' },
  { from: ['homes', -0.3], to: ['homes', 1.4], p: toHome([3.2, 2.2, 1.2]), dx: 90, dy: -40, m: { dx: -20, dy: 150 }, title: 'On a slope', text: 'Upper floors 9.15 m wide on a plot 12.8 m wide. The car porch is at street level, the garden a floor up. A lift in every home.' },
  { from: ['villas', -0.5], to: ['end', 0.5], p: toVilla([-3, 10.9, 0.3]), dx: -70, dy: -40, m: { dx: -10, dy: -24 }, title: 'Courtyard Villas', text: '1.5 & 2-storey condominium · 207 units · 4–6 bedrooms · 4 parking · from RM 3.3M' },
  { from: ['villas', -0.3], to: ['villas', 0.9], p: toVilla([2.6, 2, 1.2]), dx: 90, dy: -40, m: { dx: -20, dy: 150 }, title: 'Each 8.4 m wide', text: 'Two kinds: 2-storey with 6 bedrooms, and 1.5-storey with 4 bedrooms, each with its own courtyard.' },
]
// the hero (docs/hero-plan.md): the plan seen from straight above (north up), drawn on paper; held while the homes begin
// to rise out of it; then tipping down to the aerial and on to the gate. It replaces the first two keys of KEYS.
// shift: on a wide screen the plan sits right of the title; tallShift: on a phone it sits under the title.
const PLAN_TOP = { id: 'plan', eye: [0, 390, 3.5], at: [0, 0, 3], fov: 50, keep: 0.5, shift: [-0.36, 0.03], tallShift: [0, 0.01] }
export const HERO_KEYS = [PLAN_TOP, { ...PLAN_TOP, id: 'rise', dt: 0.5 }, { ...KEYS[1], id: 'aerial', dt: 1.0 }, ...KEYS.slice(2)]
export const HERO_NOTES = NOTES.map((n, i) => (i === 0 ? { ...n, from: ['aerial', 0.2] } : n))

// where the form rises (screens from the key named), and the nav links' targets
export const FORM = ['villas', 0.9]
export const ANCHORS = { about: 'plan', facilities: 'gate', residences: 'homes', enquire: 'end' }
