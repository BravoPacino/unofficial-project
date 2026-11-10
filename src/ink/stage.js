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
const WEIGHT = { heavy: 1.7, main: 1, soft: 0.7, hair: 0.5 }   // line widths, CSS px

// Tone → ink. The grain is two octaves of smooth noise, thresholded so that the share of inked pixels equals the
// darkness (the logistic term is that noise's measured quantile curve). Blue ÷ red of the tone target marks plain
// surfaces (walls: 1) from clean ones (glass, the rooms behind it: 0.5); plain ones get a little mottling and a few specks.
const STIPPLE_FS = /* glsl */`
  precision highp float;
  uniform sampler2D tTone; uniform vec2 uRes; uniform float uDpr; uniform vec3 uInk; uniform vec3 uPaper;
  float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  vec2 h22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h12(i), h12(i + vec2(1., 0.)), f.x), mix(h12(i + vec2(0., 1.)), h12(i + vec2(1., 1.)), f.x), f.y); }
  void main(){
    vec4 t = texture2D(tTone, gl_FragCoord.xy / uRes);
    if (t.a < .5) { gl_FragColor = vec4(0.); return; }
    vec2 px = gl_FragCoord.xy / uDpr;
    float plain = step(.75, t.b / max(t.r, .001));
    float d = 1. - clamp(t.r, 0., 1.);
    d += plain * .04 * smoothstep(.55, .9, vn(px / 44. + 3.1)) * (1. - d);
    // light greys print as clean paper, mid greys as a light grain; only the deep shade gets dense
    float c = clamp(.92 * pow(max(d - .16, 0.) / .84, 1.45), .0005, .985);
    float T = .5 + .092 * log(c / (1. - c));
    float g = .6 * vn(px / .78) + .4 * vn(px / .4 + 17.3);
    float ink = 1. - smoothstep(T - .035, T + .035, g);
    vec2 cell = floor(px / 11.); float r = mix(.4, 1., h12(cell + 91.));
    float speck = step(h12(cell + 37.), .008 * plain) * (1. - smoothstep(r - .45, r + .35, length(px - (cell + .15 + .7 * h22(cell + 5.)) * 11.)));
    ink = max(max(ink, speck), smoothstep(.86, .9, d));
    gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.);
    #include <colorspace_fragment>
  }`

export function makeStage(canvas, { view, ink = '#211e1a', paper = '#efe8da' }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: false })
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const NEAR = 1, FAR = 400
  const camera = new THREE.PerspectiveCamera(30, 1, NEAR, FAR)
  let shown = view
  const aim = (v) => { camera.position.set(v.camX ?? v.cx, v.eye, v.dist); camera.rotation.set(0, 0, 0); camera.updateMatrixWorld() }
  aim(view)

  scene.add(new THREE.AmbientLight(0xffffff, AMBIENT * Math.PI))
  const sun = new THREE.DirectionalLight(0xffffff, Math.PI)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 60, far: 170 })
  sun.shadow.camera.updateProjectionMatrix()
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.012
  sun.target.position.set(view.cx, 5, -4)
  scene.add(sun, sun.target)

  // clean surfaces carry half the blue: the stipple pass reads that as "no mottling, no specks"
  const grey = (a, clean) => new THREE.MeshLambertMaterial({ color: new THREE.Color().setRGB(a, a, clean ? a * 0.5 : a, THREE.LinearSRGBColorSpace) })
  const mats = new Map()
  // flat: unlit, one grey on every face (a background house drawn a tone lighter)
  const flats = new Map()
  const flatMat = (a) => flats.get(a) || flats.set(a, new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(a, a, a * 0.5, THREE.LinearSRGBColorSpace) })).get(a)
  const mat = (a, clean = false) => { const k = a + (clean ? 'c' : ''); return mats.get(k) || mats.set(k, grey(a, clean)).get(k) }
  const lines = { heavy: [], main: [], soft: [], hair: [] }

  const kit = {
    THREE,
    /** A box: centre, size, grey value. line: weight of its edges ('heavy' | 'main' | 'soft' | 'hair'), or false for none.
     *  clean: no mottling or specks (glass, rooms behind glass). shade: receives cast shadows. flat: unlit. */
    box(x, y, z, w, h, d, a = 0.97, { line = 'main', cast = true, clean = false, shade = true, flat = false } = {}) {
      const g = new THREE.BoxGeometry(w, h, d).translate(x, y, z)
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
    /** Ink lines given as pairs of points. */
    seg(pairs, line = 'main') { for (const [p, q] of pairs) lines[line].push(...p, ...q) },
    rect(x0, y0, x1, y1, z, line = 'main') { kit.seg([[[x0, y0, z], [x1, y0, z]], [[x1, y0, z], [x1, y1, z]], [[x1, y1, z], [x0, y1, z]], [[x0, y1, z], [x0, y0, z]]], line) },
  }

  // tone target + the full-screen stipple pass
  const target = new THREE.WebGLRenderTarget(4, 4, { samples: 4, depthBuffer: true })
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quadMat = new THREE.ShaderMaterial({
    uniforms: { tTone: { value: target.texture }, uRes: { value: new THREE.Vector2() }, uDpr: { value: 1 }, uInk: { value: new THREE.Color(ink) }, uPaper: { value: new THREE.Color(paper) } },
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: STIPPLE_FS, depthTest: false, depthWrite: false, transparent: true, blending: THREE.NoBlending,
  })
  const quadScene = new THREE.Scene(); quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat))
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
  const lineMats = []

  function finish() {
    for (const [name, opacity] of [['hair', 0.5], ['soft', 0.72], ['main', 1], ['heavy', 1]]) {
      if (!lines[name].length) continue
      const m = new LineMaterial({ color: new THREE.Color(ink), linewidth: WEIGHT[name], transparent: opacity < 1, opacity, depthWrite: false })
      const l = new LineSegments2(new LineSegmentsGeometry().setPositions(lines[name]), m); l.layers.set(L_LINE); scene.add(l); lineMats.push([m, WEIGHT[name]])
    }
  }

  /** w × h in CSS px; v: the view to show in that box (defaults to the one the stage was made with) */
  function resize(w, h, v = view) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false)
    target.setSize(Math.round(w * dpr), Math.round(h * dpr))
    shown = v; aim(v)
    const f = frustum(v, w, h, NEAR)
    // written straight into the matrix: updateProjectionMatrix() would replace this shifted frustum with a centred one
    camera.projectionMatrix.makePerspective(f.left, f.right, f.top, f.bottom, NEAR, FAR)
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    const width = v.width
    quadMat.uniforms.uRes.value.set(w * dpr, h * dpr); quadMat.uniforms.uDpr.value = dpr
    const k = Math.max(0.58, Math.min(1.15, w / width / 44))            // lines thin out when the drawing is small
    for (const [m, lw] of lineMats) { m.resolution.set(w * dpr, h * dpr); m.linewidth = lw * k * dpr }
  }

  /** dir: unit vector pointing from the scene towards the sun */
  function render(dir) {
    sun.position.set(shown.cx + dir[0] * 110, 5 + dir[1] * 110, -4 + dir[2] * 110)
    sun.target.position.set(shown.cx, 5, -4)
    sun.intensity = (Math.PI * (1 - AMBIENT)) / Math.max(dir[2], 0.25)       // a face square to the drawing, in the sun, prints at its own grey
    camera.layers.set(L_SOLID); camera.layers.enable(L_TONE)
    renderer.setRenderTarget(target); renderer.clear(); renderer.render(scene, camera)
    renderer.setRenderTarget(null); renderer.clear()
    renderer.render(quadScene, quadCam)
    renderer.clearDepth()
    camera.layers.set(L_SOLID); scene.overrideMaterial = depthOnly; renderer.render(scene, camera); scene.overrideMaterial = null
    camera.layers.set(L_LINE); renderer.render(scene, camera)
  }

  const dispose = () => { renderer.dispose(); target.dispose(); renderer.forceContextLoss() }
  return { kit, finish, resize, render, dispose }
}
