// The oblique ink scenes. Each one is the line-drawing scene from tools/drawings/scenes/ (traced from the
// developer's render, sizes estimated), built into an ink stage through adapter.js. build(ink) returns the view.
// Each drawing is about one thing (focus): the rest of the scene is drawn as a faint ghost around it.
import { adaptKit } from './adapter'

const make = (load, { aspect = 2, shadow, disc = true, focus = null, focusOf = null, look = null } = {}) => ({
  load,
  disc,
  build: (mod) => (ink) => {
    const v = mod.default(adaptKit(ink, focusOf ? focusOf(mod) : focus))
    return { look: { eye: v.eye, at: v.at, fov: v.fov, aspect, ...look }, shadow }
  },
})

const inBox = (x0, x1, y0, y1, z0, z1) => (x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1
// the pedestrian bridge: within a band around its centre line (walkway.js: A → B, 4.6 m wide)
const onBridge = ({ A, B }) => (x, y, z) => {
  const dx = B[0] - A[0], dz = B[1] - A[1], L2 = dx * dx + dz * dz
  const t = Math.max(0, Math.min(1, ((x - A[0]) * dx + (z - A[1]) * dz) / L2))
  const ext = 4.2 / Math.sqrt(L2), tt = ((x - A[0]) * dx + (z - A[1]) * dz) / L2
  // down to the road below, so the gap the bridge crosses (walls, road, the car under it) is drawn with it
  return y > -3.4 && y < 2 && tt > -ext && tt < 1 + ext && Math.hypot(x - A[0] - dx * t, z - A[1] - dz * t) < 4.5
}

export const SCENES = {
  villas: make(() => import('../../tools/drawings/scenes/villas.js'), { shadow: { x: 27, z: 4, r: 46 } }),
  // the pool itself: water, islands, fountains, the round spa
  pool: make(() => import('../../tools/drawings/scenes/pool.js'), { shadow: { x: 0, z: -12, r: 44 }, focus: inBox(-12.5, 13, -1, 3, -19.5, 25) }),
  walkway: make(() => import('../../tools/drawings/scenes/walkway.js'), { shadow: { x: 2, z: 9, r: 22 }, focusOf: (mod) => onBridge(mod.BRIDGE) }),
  // the timber deck and its two nests
  lounge: make(() => import('../../tools/drawings/scenes/lounge.js'), { shadow: { x: 0, z: 2, r: 16 }, focus: inBox(-7.5, 6, -1, 3.2, -1.6, 5) }),
  // the four treadmills
  gym: make(() => import('../../tools/drawings/scenes/gym.js'), { shadow: { x: 0, z: 4, r: 14 }, focus: inBox(-3.2, 3.2, 0, 2.2, 1.8, 5.2) }),
  // the long pool and the boat in it
  aerial: make(() => import('../../tools/drawings/scenes/aerial.js'), { aspect: 900 / 1600, shadow: { x: 0, z: -28, r: 52 }, disc: false, focus: inBox(-11, 14, -1, 5, -66, 23) }),
  // the entrance portal and the guardhouse under it
  entrance: make(() => import('../../tools/drawings/scenes/entrance.js'), { shadow: { x: 0, z: -6, r: 22 }, focus: inBox(-8.6, 8.6, 0.5, 11, -14.5, 0.6) }),
}
