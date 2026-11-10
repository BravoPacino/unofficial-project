// Ink stage: a one-point perspective of a façade, drawn the way an inked plate is —
//   1. tone   : the model lit by one sun with hard cast shadows, rendered to a grey target
//   2. stipple: that grey turned into grains of ink on paper (density = darkness), solid black past a threshold
//   3. line   : edges in three weights over the top, hidden where a face is in front
// Faces carry only a grey value (albedo); the only texture is the grain itself.
import * as THREE from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'

import { frustum } from './project'
export { projector, scaleAt, toPlane } from './project'

const L_SOLID = 0, L_TONE = 1, L_LINE = 2
const AMBIENT = 0.66                         // a white wall in full shadow: about a fifth ink, after the curve below
const WEIGHT = { heavy: 1.7, main: 1, soft: 0.7, hair: 0.5, ghost: 0.6 }   // line widths, CSS px; ghost: the houses either side

// Tone → ink, as an even stipple: one round dot per small cell, its area equal to the darkness, nudged a little off
// the grid so it does not read as a screen. No random grain, no specks: random noise looks like dirt.
// Light greys print as clean paper; past DEEP the shade is solid.
const STIPPLE_FS = /* glsl */`
  precision highp float;
  uniform sampler2D tTone; uniform vec2 uRes; uniform float uDpr; uniform float uCell; uniform vec3 uInk; uniform vec3 uPaper;
  vec2 h22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
  const float DEEP = .9;
  #define CELL uCell
  void main(){
    vec4 t = texture2D(tTone, gl_FragCoord.xy / uRes);
    if (t.a < .5) { gl_FragColor = vec4(0.); return; }
    vec2 px = gl_FragCoord.xy / uDpr;
    float d = 1. - clamp(t.r, 0., 1.);
    float c = .9 * pow(max(d - .2, 0.) / .8, 1.3);                 // share of the paper the dots cover
    vec2 q = px / CELL, cell = floor(q);
    vec2 centre = .5 + (h22(cell) - .5) * .28;
    float dist = length(fract(q) - centre) * CELL;
    float r = CELL * sqrt(c / 3.14159);
    float aa = .6 / uDpr;
    float ink = (1. - smoothstep(r - aa, r + aa, dist)) * step(.002, c);
    ink = max(ink, smoothstep(DEEP - .03, DEEP, d));
    gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.);
    #include <colorspace_fragment>
  }`

/** A WebGL renderer set up for ink. Several stages can share one (pass it as `renderer`). */
export function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: false })
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  return renderer
}

/**
 * view: either a square-on façade view { cx, cy, width, eye, dist, camX } (see project.js),
 * or an oblique one { look: { eye: [x,y,z], at: [x,y,z], fov, aspect } } where fov is vertical at that aspect.
 * Either may carry shadow: { x, z, r } — the ground area, in metres, the sun's shadows must cover.
 */
export function makeStage(canvas, { view, ink = '#211e1a', paper = '#efe8da', renderer: shared = null }) {
  const renderer = shared || makeRenderer(canvas)

  const scene = new THREE.Scene()
  const NEAR = 1, FAR = 400
  const camera = new THREE.PerspectiveCamera(30, 1, NEAR, FAR)
  let shown = view
  const aim = (v) => {
    if (v.look) { camera.position.set(...v.look.eye); camera.lookAt(...v.look.at) }
    else { camera.position.set(v.camX ?? v.cx, v.eye, v.dist); camera.rotation.set(0, 0, 0) }
    camera.updateMatrixWorld()
  }
  // the light is kept in front of whoever is looking: (x, y, z) of light.js are the camera's right, up and back
  const toWorld = (v, d) => {
    if (!v.look) return d
    const [ex, , ez] = v.look.eye, [ax, , az] = v.look.at, L = Math.hypot(ax - ex, az - ez) || 1, fx = (ax - ex) / L, fz = (az - ez) / L
    // and swung round to the side, so shadows fall across what is seen rather than behind it
    const sx = d[0] * 1.35 + Math.sign(d[0] || 1) * 0.12, sz = d[2] * 0.9, n = Math.hypot(sx, d[1], sz)
    const [x, y, z] = [sx / n, d[1] / n, sz / n]
    return [-fz * x - fx * z, y, fx * x - fz * z]
  }
  const shadowOf = (v) => v.shadow || (v.look ? { x: v.look.at[0], z: v.look.at[2], r: 40 } : { x: v.cx, z: -4, r: 22 })
  aim(view)

  scene.add(new THREE.AmbientLight(0xffffff, AMBIENT * Math.PI))
  const sun = new THREE.DirectionalLight(0xffffff, Math.PI)
  sun.castShadow = true
  // 2048: a 4096 map is 64 MB of GPU memory per drawing, and phones run out (the page reloads)
  sun.shadow.mapSize.set(2048, 2048)
  const fitShadow = (r) => { Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 260 }); sun.shadow.camera.updateProjectionMatrix() }
  fitShadow(22)
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.012
  scene.add(sun, sun.target)

  // clean surfaces carry half the blue: the stipple pass reads that as "no mottling, no specks"
  const grey = (a, clean) => new THREE.MeshLambertMaterial({ color: new THREE.Color().setRGB(a, a, clean ? a * 0.5 : a, THREE.LinearSRGBColorSpace) })
  const mats = new Map()
  // flat: unlit, one grey on every face (a background house drawn a tone lighter)
  const flats = new Map()
  const flatMat = (a) => flats.get(a) || flats.set(a, new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(a, a, a * 0.5, THREE.LinearSRGBColorSpace) })).get(a)
  const mat = (a, clean = false) => { const k = a + (clean ? 'c' : ''); return mats.get(k) || mats.set(k, grey(a, clean)).get(k) }
  const lines = { heavy: [], main: [], soft: [], hair: [], ghost: [] }

  const kit = {
    THREE,
    /** A box: centre, size, grey value. line: weight of its edges ('heavy' | 'main' | 'soft' | 'hair'), or false for none.
     *  clean: no mottling or specks (glass, rooms behind glass). shade: receives cast shadows. flat: unlit. */
    box(x, y, z, w, h, d, a = 0.97, { line = 'main', cast = true, clean = false, shade = true, flat = false, ry = 0 } = {}) {
      const g = new THREE.BoxGeometry(w, h, d).applyMatrix4(new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z))
      const m = new THREE.Mesh(g, flat ? flatMat(a) : mat(a, clean)); m.castShadow = cast; m.receiveShadow = shade; m.layers.set(L_SOLID); scene.add(m)
      if (line) lines[line].push(...new THREE.EdgesGeometry(g, 1).attributes.position.array)
      return m
    },
    /** An upright rectangle facing the viewer whose grey runs from a0 (bottom) to a1 (top). Clean.
     *  shade false (the default) keeps it out of every cast shadow: glass reads as the whitest thing on the sheet. */
    pane(x0, y0, x1, y1, z, a0 = 1, a1 = 1, { shade = false } = {}) {
      const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, z)
      const c = []; for (let i = 0; i < 4; i++) { const a = g.attributes.position.getY(i) > (y0 + y1) / 2 ? a1 : a0; c.push(a, a, a * 0.5) }
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3))
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = shade; m.layers.set(L_SOLID); scene.add(m)
    },
    /** A veil that only darkens what is behind it, from k0 (bottom) to k1 (top), 1 = no change: the gloom under a soffit. */
    veil(x0, y0, x1, y1, z, k0 = 1, k1 = 0.7) {
      const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, z)
      const c = []; for (let i = 0; i < 4; i++) { const k = g.attributes.position.getY(i) > (y0 + y1) / 2 ? k1 : k0; c.push(k, k, k) }
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3))
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.MultiplyBlending, transparent: true, premultipliedAlpha: true, depthWrite: false }))
      m.layers.set(L_TONE); m.renderOrder = 5; scene.add(m)
    },
    /** Any geometry: grey a; line: edge weight or false; angle: crease angle that counts as an edge. */
    mesh(g, a = 0.97, { line = 'main', angle = 25, cast = true, clean = false, shade = true, flat = false } = {}) {
      const m = new THREE.Mesh(g, flat ? flatMat(a) : mat(a, clean)); m.castShadow = cast; m.receiveShadow = shade; m.layers.set(L_SOLID); scene.add(m)
      if (line) lines[line].push(...new THREE.EdgesGeometry(g, angle).attributes.position.array)
      return m
    },
    /** Raw line positions (x, y, z per vertex, two vertices per segment) */
    lines(arr, line = 'main') { for (let i = 0; i < arr.length; i++) lines[line].push(arr[i]) },
    /** Ink lines given as pairs of points. */
    seg(pairs, line = 'main') { for (const [p, q] of pairs) lines[line].push(...p, ...q) },
    rect(x0, y0, x1, y1, z, line = 'main') { kit.seg([[[x0, y0, z], [x1, y0, z]], [[x1, y0, z], [x1, y1, z]], [[x1, y1, z], [x0, y1, z]], [[x0, y1, z], [x0, y0, z]]], line) },
  }

  // tone target + the full-screen stipple pass
  // no multisampling: the tone is turned into dots anyway, and a 4× MSAA buffer at phone resolution is tens of MB
  const target = new THREE.WebGLRenderTarget(4, 4, { samples: 0, depthBuffer: true })
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quadMat = new THREE.ShaderMaterial({
    uniforms: { tTone: { value: target.texture }, uRes: { value: new THREE.Vector2() }, uDpr: { value: 1 }, uCell: { value: 2.6 }, uInk: { value: new THREE.Color(ink) }, uPaper: { value: new THREE.Color(paper) } },
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: STIPPLE_FS, depthTest: false, depthWrite: false, transparent: true, blending: THREE.NoBlending,
  })
  const quadScene = new THREE.Scene(); quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat))
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
  const lineMats = []

  function finish() {
    for (const [name, opacity] of [['ghost', 0.18], ['hair', 0.5], ['soft', 0.72], ['main', 1], ['heavy', 1]]) {
      if (!lines[name].length) continue
      const m = new LineMaterial({ color: new THREE.Color(ink), linewidth: WEIGHT[name], transparent: opacity < 1, opacity, depthWrite: false })
      const l = new LineSegments2(new LineSegmentsGeometry().setPositions(lines[name]), m); l.layers.set(L_LINE); scene.add(l); lineMats.push([m, WEIGHT[name]])
    }
  }

  let size = { w: 4, h: 4, dpr: 1 }
  // camera and line scale for view v in a w × h box (CSS px); nothing is rebuilt, so it is cheap enough to call every frame
  function frame(v, w = size.w, h = size.h) {
    const { dpr } = size
    shown = v; aim(v)
    let width = v.width
    if (v.look) {
      // keep the horizontal angle the view was framed with, whatever the box's shape
      const tanH = Math.tan((v.look.fov * Math.PI) / 360) * (v.look.aspect || 2), tanV = tanH * (h / w)
      camera.projectionMatrix.makePerspective(-tanH * NEAR, tanH * NEAR, tanV * NEAR, -tanV * NEAR, NEAR, FAR)
      const [ex, ey, ez] = v.look.eye, [ax, ay, az] = v.look.at
      width = 2 * tanH * Math.hypot(ax - ex, ay - ey, az - ez)              // metres across at the point looked at
    } else {
      const f = frustum(v, w, h, NEAR)
      // written straight into the matrix: updateProjectionMatrix() would replace this shifted frustum with a centred one
      camera.projectionMatrix.makePerspective(f.left, f.right, f.top, f.bottom, NEAR, FAR)
    }
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    fitShadow(shadowOf(v).r)
    const k = Math.max(0.58, Math.min(1.15, w / width / 44))            // lines thin out when the drawing is small
    for (const [m, lw] of lineMats) { m.resolution.set(w * dpr, h * dpr); m.linewidth = lw * k * dpr }
  }

  /** w × h in CSS px; v: the view to show in that box (defaults to the one the stage was made with); dpr: pixel ratio (default: the screen's, at most 2) */
  function resize(w, h, v = view, dpr = Math.min(window.devicePixelRatio || 1, 2)) {
    size = { w, h, dpr }
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false)
    target.setSize(Math.round(w * dpr), Math.round(h * dpr))
    quadMat.uniforms.uRes.value.set(w * dpr, h * dpr); quadMat.uniforms.uDpr.value = dpr; quadMat.uniforms.uCell.value = Math.max(1.8, Math.min(2.6, w / 300))   // dots in CSS px: finer on a small drawing
    frame(v, w, h)
  }

  /** where world point (x, y, z) lands in the box, in CSS px from its top left, and whether it is in front of the camera */
  const v3 = new THREE.Vector3()
  function project(x, y, z) {
    v3.set(x, y, z).applyMatrix4(camera.matrixWorldInverse)
    const front = v3.z < 0
    v3.applyMatrix4(camera.projectionMatrix)
    return { x: (v3.x + 1) / 2 * size.w, y: (1 - v3.y) / 2 * size.h, front }
  }

  /** the sun's direction in world space for light dir (camera space, from light.js) as seen from view v */
  const worldLight = (dir, v = shown) => toWorld(v, dir)

  /**
   * dir: unit vector pointing from the scene towards the sun, in the camera's terms (light.js).
   * world: the same, already in world space (worldLight), so the light stays put while the camera moves.
   * out: a render target to draw the finished drawing into instead of the screen.
   */
  let sunKey = ''
  function render(dir, { world = null, out = null } = {}) {
    const s = shadowOf(shown), wd = world || toWorld(shown, dir)
    sun.position.set(s.x + wd[0] * 120, 4 + wd[1] * 120, s.z + wd[2] * 120)
    sun.target.position.set(s.x, 4, s.z)
    // with the renderer's shadow map on manual, the shadows are worked out again only when the light moves
    const key = [sun.position.x, sun.position.y, sun.position.z, s.r].map((n) => n.toFixed(3)).join()
    if (key !== sunKey) { sunKey = key; renderer.shadowMap.needsUpdate = true }
    sun.intensity = (Math.PI * (1 - AMBIENT)) / Math.max(dir[2], 0.25)       // a face square to the drawing, in the sun, prints at its own grey
    camera.layers.set(L_SOLID); camera.layers.enable(L_TONE)
    renderer.setRenderTarget(target); renderer.clear(); renderer.render(scene, camera)
    renderer.setRenderTarget(out); renderer.clear()
    renderer.render(quadScene, quadCam)
    renderer.clearDepth()
    camera.layers.set(L_SOLID); scene.overrideMaterial = depthOnly; renderer.render(scene, camera); scene.overrideMaterial = null
    camera.layers.set(L_LINE); renderer.render(scene, camera)
  }

  // free everything this drawing put on the GPU: buffers, materials, the shadow map, the tone target
  const dispose = () => {
    scene.traverse((o) => { o.geometry?.dispose(); for (const m of [].concat(o.material || [])) m.dispose() })
    for (const m of [...mats.values(), ...flats.values(), depthOnly, quadMat]) m.dispose()
    sun.shadow.map?.dispose(); sun.shadow.map = null
    target.dispose()
    if (!shared) { renderer.dispose(); renderer.forceContextLoss() }
  }
  return { kit, finish, resize, frame, render, project, worldLight, dispose }
}
