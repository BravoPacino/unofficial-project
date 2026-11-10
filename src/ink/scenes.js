// The oblique ink scenes. Each one is the line-drawing scene from tools/drawings/scenes/ (traced from the
// developer's render, sizes estimated), built into an ink stage through adapter.js. build(ink) returns the view.
import { adaptKit } from './adapter'

const make = (load, { aspect = 2, shadow, disc = true } = {}) => ({
  load,
  disc,
  build: (mod) => (ink) => {
    const v = mod.default(adaptKit(ink))
    return { look: { eye: v.eye, at: v.at, fov: v.fov, aspect }, shadow }
  },
})

export const SCENES = {
  villas: make(() => import('../../tools/drawings/scenes/villas.js'), { shadow: { x: 27, z: 4, r: 46 } }),
  pool: make(() => import('../../tools/drawings/scenes/pool.js'), { shadow: { x: 0, z: -12, r: 44 } }),
  walkway: make(() => import('../../tools/drawings/scenes/walkway.js'), { shadow: { x: 0, z: -8, r: 46 } }),
  lounge: make(() => import('../../tools/drawings/scenes/lounge.js'), { shadow: { x: 0, z: -4, r: 34 } }),
  gym: make(() => import('../../tools/drawings/scenes/gym.js'), { shadow: { x: 0, z: -18, r: 40 } }),
  aerial: make(() => import('../../tools/drawings/scenes/aerial.js'), { aspect: 900 / 1600, shadow: { x: 0, z: -28, r: 52 }, disc: false }),
  entrance: make(() => import('../../tools/drawings/scenes/entrance.js'), { shadow: { x: 0, z: -6, r: 40 } }),
}
