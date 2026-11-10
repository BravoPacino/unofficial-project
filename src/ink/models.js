// The square-on ink drawings the site can show with InkDrawing (drag the sun, hotspots).
import homes, * as H from './homes'
import villas, * as V from './villas'

export const HOMES = {
  build: homes, VIEW: H.VIEW, CARD_VIEW: H.CARD_VIEW, NARROW_VIEW: H.NARROW_VIEW, SPOTS: H.SPOTS, OUTLINE: H.OUTLINE, GROUND_Z: H.GROUND_Z,
  TREES: [{ x: -6.1, z: H.GROUND_Z + 0.8, h: 8.2, seed: 7 }, { x: 7.0, z: H.GROUND_Z + 0.8, h: 7.8, seed: 21 }],
  label: 'Courtyard Homes',
}
export const VILLAS = {
  build: villas, VIEW: V.VIEW, CARD_VIEW: V.CARD_VIEW, NARROW_VIEW: V.NARROW_VIEW, SPOTS: V.SPOTS, OUTLINE: V.OUTLINE, GROUND_Z: V.GROUND_Z,
  TREES: V.TREES,
  label: 'Courtyard Villas',
}
export const MODELS = { homes: HOMES, villas: VILLAS }
