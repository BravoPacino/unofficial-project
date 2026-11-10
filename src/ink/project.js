// The one projection every layer of an ink drawing shares: the WebGL camera, the 2D tree canvases,
// the hotspots, and tools/ink/overlay.cjs. No dependencies, so Node can import it too.
//
// A view is a one-point perspective square to the façade, shifted (like a shift lens) so verticals stay vertical:
//   cx, cy  centre of what the box shows, measured on the façade plane z = 0 (metres)
//   width   how many metres across the box shows on that plane
//   eye     camera height; camX the camera's x (defaults to cx)
//   dist    camera distance in front of the façade plane

/** A point (x, y, z) seen through the camera, expressed where it lands on the plane z = 0 */
export const toPlane = (view, x, y, z = 0) => {
  const cam = view.camX ?? view.cx, s = view.dist / (view.dist - z)
  return [cam + (x - cam) * s, view.eye + (y - view.eye) * s]
}

/** metres → CSS pixels for a view drawn into a w × h box */
export const projector = (view, w, h) => {
  const hm = view.width * (h / w)
  return (x, y, z = 0) => {
    const [X, Y] = toPlane(view, x, y, z)
    return [((X - (view.cx - view.width / 2)) / view.width) * w, ((view.cy + hm / 2 - Y) / hm) * h]
  }
}

/** How many CSS px one metre is at depth z */
export const scaleAt = (view, w, z = 0) => (w / view.width) * (view.dist / (view.dist - z))

/** Frustum for a THREE.PerspectiveCamera at (camX, eye, dist) looking down −z, in near-plane units */
export const frustum = (view, w, h, near) => {
  const hm = view.width * (h / w), cam = view.camX ?? view.cx, k = near / view.dist
  return {
    left: (view.cx - view.width / 2 - cam) * k, right: (view.cx + view.width / 2 - cam) * k,
    top: (view.cy + hm / 2 - view.eye) * k, bottom: (view.cy - hm / 2 - view.eye) * k,
  }
}
