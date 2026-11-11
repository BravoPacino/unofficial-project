// The one take laid out on the masterplan (docs/world-plan.md §2.3): the camera's keys in world metres (site.js: x east,
// y up, z south; the pool valley floor is y = 0, the walkway level 13.6). dt: screens of scroll from the key before.
// stop: the place the camera slows for (the nav links point there). Notes: p, a world point; [t0, t1], the scroll
// (screens) they show over; dx / dy where the label sits from the point (CSS px; m: on a phone). own: one of our own
// designs (no image of it was published). Every word is the site's own copy or the plan's own legend.
//
// This is the sample: legs 4–6 (the green wall down into the valley → the lounge deck → the pool → through the gym).
export const KEYS = [
  // 4 · on the walkway at the valley's north end, then down in front of the planted wall
  { eye: [-4.3, 19.5, -116], at: [-4.0, -2, -66], fov: 54 },                      // looking down into the valley
  { eye: [-4.3, 11.5, -105], at: [-4.0, 4, -55], fov: 52, dt: 0.9 },
  { eye: [-4.2, 4.2, -101], at: [-3.6, 1.8, -55], fov: 52, dt: 0.7 },
  // 5 · along the water: the lounge deck (D) on the east side, turning to it, then on down the pool past the island
  { eye: [-6.8, 2.0, -95], at: [-1, 0.6, -70], fov: 52, dt: 0.6 },
  { eye: [-8.2, 1.9, -88.5], at: [1.2, 0.5, -78.5], fov: 54, dt: 0.6, stop: 'lounge' },
  { eye: [-7.6, 1.9, -85.5], at: [1.8, 0.4, -78.5], fov: 54, dt: 0.7 },
  { eye: [-5.2, 1.8, -74], at: [-3.4, 1.4, -32], fov: 46, dt: 0.7 },
  { eye: [-4.6, 1.7, -62], at: [-4.2, 1.6, -22], fov: 44, dt: 0.8, stop: 'pool' },
  // 6 · into the floating gym through its glass, behind the four treadmills, and out through the far side
  { eye: [-4.45, 1.9, -40], at: [-4.45, 1.9, -10], fov: 48, dt: 0.8 },
  { eye: [-4.45, 1.75, -29.5], at: [-4.45, 2.2, 0], fov: 50, dt: 0.6 },
  { eye: [-4.45, 1.72, -28.2], at: [-4.45, 2.1, 0], fov: 50, dt: 0.7, stop: 'gym' },
  { eye: [-3.8, 3.9, -17.4], at: [-3.6, 1.6, 15], fov: 50, dt: 0.5 },               // out through the south glass, and up at once:
  { eye: [-3.6, 6.4, -12.5], at: [-3.6, 0.4, 24], fov: 52, dt: 0.5 },               // the changing room, sauna and studio fill the valley
  { eye: [-3.6, 8.2, -2], at: [-3.8, 0.2, 36], fov: 52, dt: 0.7 },                  // floor between them, so over their roofs
]

export const NOTES = [
  { p: [-5.6, 9, -107.2], t0: 0.2, t1: 1.3, dx: 70, dy: -40, title: 'A · Verdant Green Wall', text: 'The pool valley’s north end, planted from the valley floor up to the walkway level.' },
  { p: [0.4, 0.8, -79], t0: 2.4, t1: 3.6, dx: -90, dy: -120, title: 'Lounge Decks', text: 'Lounge decks look out over resort-style pools.' },
  { p: [-11.5, 0.6, -74], t0: 2.5, t1: 3.6, dx: 40, dy: -170, title: 'E · Aqua Gym', text: '', own: true },
  { p: [0.2, 0.5, -51], t0: 4.2, t1: 5.4, dx: 60, dy: -130, title: 'Resort-style pool', text: 'Water at the centre, with a planted island and the floating gym at its far end.' },
  { p: [-8.8, 1.6, -42], t0: 4.6, t1: 5.7, dx: -40, dy: -110, title: 'J · Poolside Cabanas', text: '' },
  { p: [-4.45, 1.3, -21.6], t0: 6.3, t1: 7.4, dx: 90, dy: -150, title: 'K · Floating Gym', text: 'Four treadmills facing the glass, looking out over the water.' },
  { p: [-7.4, 3.4, -11], t0: 7.5, t1: 8.3, dx: -50, dy: -60, title: 'L · Changing Room · M · Sauna', text: '', own: true },
  { p: [-3.5, 3.9, 1.5], t0: 7.9, t1: 8.6, dx: 70, dy: -50, title: 'N · Fitness Studio', text: '', own: true },
]
