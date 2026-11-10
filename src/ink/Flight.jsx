import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { makeRenderer, makeStage } from './stage'
import { SCENES } from './scenes'
import { adaptKit } from './adapter'
import { clockOf, dayOf, lightAt } from './light'

// One take (docs/animation-plan.md, direction A): scrolling moves one camera through the estate. Each stop is its own
// ink scene; at most two are alive at a time (this one and the next), and the change from one to the next is made dot by
// dot: the old drawing breaks into dots that shrink while the new one's dots grow. The light is George Town's sun now,
// fixed in the world for each stop so the shadows stay put while the camera moves. Notes are pinned to points in the
// scene and drawn out with an ink leader when the camera slows down there. Sample: aerial → pool → walkway.
const INK = '#211e1a', PAPER = '#efe8da', DISC = '#dba84a'
const T = 0.45                                                   // screens of scroll over which one stop turns into the next

// path: camera keys { eye, at, fov } (fov vertical, at a 16:9 box), passed through in order as the stop's scroll goes by.
// dwell: where on the path the light is worked out (and the notes sit). Notes: p, the point; [a, b], when on the path
// they show; dx/dy, where the label sits from the point (CSS px). Facts only from the site's own copy.
const STOPS = [
  {
    scene: 'aerial', len: 2.0, dwell: 0.6, shadow: { x: 0, z: -24, r: 56 },
    path: [
      { eye: [-6, 50, 52], at: [-1, -2, -20], fov: 44 },
      { eye: [-4.5, 38, 42], at: [-1.5, -4, -24], fov: 46 },
      { eye: [-3.5, 22, 26], at: [-1.5, -3, -30], fov: 48 },
      { eye: [-1.5, 10, 14], at: [0, 0.5, -30], fov: 50 },
    ],
    notes: [
      { p: [-1, 0, 6], a: 0.22, b: 0.62, dx: 90, dy: -110, title: '239 homes on 12 acres', text: 'A low-density, gated and guarded enclave in George Town.' },
      { p: [2.5, 0, -41], a: 0.46, b: 0.86, dx: -120, dy: -90, title: 'Serene courtyards', text: 'Laid out around courtyards, set among gardens, pools and pedestrian bridges.' },
    ],
  },
  {
    scene: 'pool', len: 2.0, dwell: 0.5, shadow: { x: 0, z: -10, r: 46 },
    path: [
      { eye: [5, 9, 46], at: [0.5, 1.5, -12], fov: 34 },
      { eye: [3.6, 4.5, 36], at: [0, 3, -16], fov: 30 },
      { eye: [2.6, 1.9, 25], at: [-0.5, 4.2, -20], fov: 26 },
      { eye: [1.6, 1.5, 15], at: [-1, 3.6, -22], fov: 28 },
    ],
    notes: [
      { p: [-4, 0.1, 6], a: 0.3, b: 0.8, dx: -40, dy: -150, title: 'Resort-style pool', text: 'Lounge decks look out over resort-style pools, with a floating gym and courtyards in between.' },
    ],
  },
  {
    scene: 'walkway', len: 2.2, dwell: 0.5, shadow: { x: 2, z: 4, r: 30 },
    path: [
      { eye: [-12, 15, 34], at: [6, -1.5, -10], fov: 34 },
      { eye: [-8.2, 8.9, 21.2], at: [7.8, -1.35, -8.6], fov: 30 },
      { eye: [-6, 6.2, 12], at: [8, -2.2, -16], fov: 32 },
      { eye: [-3.5, 4.2, 3], at: [6, -2.6, -26], fov: 36 },
    ],
    notes: [
      { p: [-2.5, 1.3, 4.5], a: 0.2, b: 0.62, dx: -70, dy: -140, title: 'Pedestrian bridges', text: 'Paths and pedestrian bridges thread through the gardens.' },
      { p: [6.2, -2.0, -10], a: 0.48, b: 0.92, dx: 80, dy: -130, title: '4–6 parking lots per home', text: 'Rare on land-scarce Penang Island, and planned for several generations under one roof.' },
    ],
  },
]
const START = STOPS.reduce((a, s, i) => { a.push(i ? a[i - 1] + STOPS[i - 1].len - T : 0); return a }, [])
const TOTAL = START.at(-1) + STOPS.at(-1).len

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t))
// Catmull–Rom through the keys; u in [0, 1]
function along(keys, u) {
  const n = keys.length - 1, f = clamp01(u) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i
  const K = (j) => keys[Math.max(0, Math.min(n, j))]
  const cr = (p0, p1, p2, p3) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
  const v = (k) => [0, 1, 2].map((d) => cr(K(i - 1)[k][d], K(i)[k][d], K(i + 1)[k][d], K(i + 2)[k][d]))
  return { eye: v('eye'), at: v('at'), fov: lerp(K(i).fov, K(i + 1).fov, ease(t)) }
}
// framed at 16:9: a wider screen keeps the keys' horizontal angle; a tall phone screen keeps a little more height instead
const lookAt = (stop, u, w, h) => ({ look: { ...along(stop.path, u), aspect: w >= h ? 16 / 9 : 1.25 * (w / h) }, shadow: stop.shadow })

const MIX_FS = /* glsl */`
  precision highp float;
  uniform sampler2D tA; uniform sampler2D tB; uniform vec2 uRes; uniform float uDpr; uniform float uCell; uniform float uMix; uniform vec2 uDir;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    vec2 uv = gl_FragCoord.xy / uRes, px = gl_FragCoord.xy / uDpr;
    vec2 cell = floor(px / uCell), cc = (cell + .5) * uCell;
    float sweep = clamp(dot(cc * uDpr / uRes - .5, uDir) + .5, 0., 1.);       // 0 → 1 the way the camera is going
    float th = mix(h(cell), sweep, .85) * .75;
    float l = smoothstep(th, th + .25, uMix);                                  // this cell: 0 old, 1 new
    float d = length(px - cc) / uCell, R = .72;
    vec4 a = texture2D(tA, uv), b = texture2D(tB, uv), col = vec4(0.);
    if (d < R * (1. - l)) col = a;                                             // the old drawing shrinks into dots
    if (d < R * l) col = b;                                                    // the new one grows out of them
    gl_FragColor = col;
    #include <colorspace_fragment>
  }`

export default function Flight() {
  const boxRef = useRef(), canvasRef = useRef(), notesRef = useRef(), discRef = useRef(), clockRef = useRef(), failRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current, box = boxRef.current, notesEl = notesRef.current
    let renderer
    try { renderer = makeRenderer(canvas) } catch { failRef.current.hidden = false; return undefined }
    renderer.shadowMap.autoUpdate = false                                      // shadows are worked out again only when a light moves
    const now = Date.now(), light = lightAt(now, dayOf(now))
    clockRef.current.textContent = `George Town · ${clockOf(now)} · the light in these drawings is the sun there now`

    // the two drawings being mixed, and the full-screen pass that mixes them dot by dot
    const rt = () => { const r = new THREE.WebGLRenderTarget(4, 4, { samples: 0 }); r.texture.colorSpace = THREE.SRGBColorSpace; return r }
    const rtA = rt(), rtB = rt()
    const mixMat = new THREE.ShaderMaterial({
      uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uRes: { value: new THREE.Vector2() }, uDpr: { value: 1 }, uCell: { value: 7 }, uMix: { value: 0 }, uDir: { value: new THREE.Vector2(0, 1) } },
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: MIX_FS, depthTest: false, depthWrite: false, transparent: true, blending: THREE.NoBlending,
    })
    const mixScene = new THREE.Scene(); mixScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mixMat))
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // stops: built when needed (this one and the next), freed as soon as they are behind
    const live = new Map(), building = new Set()
    const build = async (i) => {
      if (i < 0 || i >= STOPS.length || live.has(i) || building.has(i)) return
      building.add(i)
      const stop = STOPS[i], def = SCENES[stop.scene], mod = await def.load()
      const st = makeStage(null, { view: lookAt(stop, 0, 16, 9), ink: INK, paper: PAPER, renderer })
      // drawn in full (on the way through, everything is the subject), but only the trees of the subject: a tree right in
      // front of a moving camera is a black trunk across the picture
      mod.default(adaptKit(st.kit, null, { trees: def.focusOf ? def.focusOf(mod) : def.focus })); st.finish()
      st.world = st.worldLight(light.dir, lookAt(stop, stop.dwell, 16, 9))     // the light, fixed in the world for the whole stop
      st.sized = null
      building.delete(i); live.set(i, st); kick()
    }
    const free = (keep) => { for (const [i, st] of live) if (!keep.has(i)) { st.dispose(); live.delete(i) } }

    // notes: built once, moved every frame
    const notes = STOPS.map((stop) => stop.notes.map((n) => {
      const el = document.createElement('div'); el.className = 'fl-note'
      el.innerHTML = `<svg class="fl-lead"><line/><circle r="2.6"/></svg><div class="fl-label"><b></b><span></span></div>`
      el.querySelector('b').textContent = n.title; el.querySelector('span').textContent = n.text
      notesEl.append(el); return { n, el, line: el.querySelector('line'), dot: el.querySelector('circle'), label: el.querySelector('.fl-label') }
    }))

    let W = 0, H = 0, dpr = 1, full = false, cur = -1, want = 0, raf = 0, idle = 0, lastT = 0, dirty = true
    const measure = () => {
      W = box.clientWidth; H = box.clientHeight
      const top = -box.parentElement.getBoundingClientRect().top, run = box.parentElement.offsetHeight - H
      want = clamp01(top / (run || 1)) * TOTAL
    }
    const size = (d) => {
      dpr = d
      for (const r of [rtA, rtB]) r.setSize(Math.round(W * d), Math.round(H * d))
      mixMat.uniforms.uRes.value.set(W * d, H * d); mixMat.uniforms.uDpr.value = d; mixMat.uniforms.uCell.value = Math.max(3.5, Math.min(5.5, W / 260))   // about two grains of the stipple
    }
    const draw = (t) => {
      const on = STOPS.map((_, i) => i).filter((i) => t >= START[i] - 0.001 && t <= START[i] + STOPS[i].len + 0.001)
      const ahead = new Set([...on, on.at(-1) + 1])
      for (const i of ahead) build(i)
      free(new Set([...ahead, on[0] - 1].filter((i) => i >= 0)))
      const ready = on.filter((i) => live.has(i))
      if (!ready.length) return false
      const key = `${W}x${H}@${dpr}`
      const show = (i, out) => {
        const st = live.get(i), stop = STOPS[i], u = ease((t - START[i]) / stop.len), v = lookAt(stop, u, W, H)
        if (st.sized !== key) { st.resize(W, H, v, dpr); st.sized = key } else st.frame(v, W, H)
        st.render(light.dir, { world: st.world, out })
        return { st, stop, u, v }
      }
      let main
      if (ready.length === 2) {
        const [a, b] = ready, m = clamp01((t - START[b]) / T)
        const A = show(a, rtA), B = show(b, rtB)
        mixMat.uniforms.uMix.value = m
        renderer.setRenderTarget(null); renderer.clear(); renderer.render(mixScene, quadCam)
        main = m < 0.5 ? A : B
        place(A, 1 - ease(m * 2)); place(B, ease(m * 2 - 1))
        for (const [j, ns] of notes.entries()) if (j !== a && j !== b) for (const x of ns) x.el.style.opacity = 0
      } else {
        main = show(ready[0], null)
        for (const [j, ns] of notes.entries()) if (j !== ready[0]) for (const x of ns) x.el.style.opacity = 0
        place(main, 1)
      }
      sunDisc(main)
      return true
    }
    // the notes of one stop, faded by k
    const place = ({ st, stop, u }, k) => {
      for (const { n, el, line, dot, label } of notes[STOPS.indexOf(stop)]) {
        const vis = k * clamp01((u - n.a) / 0.08) * clamp01((n.b - u) / 0.08), q = st.project(...n.p)
        if (!q.front || vis <= 0.001) { el.style.opacity = 0; continue }
        const dx = W < 700 ? n.dx * 0.55 : n.dx, dy = W < 700 ? n.dy * 0.7 : n.dy
        const lw = label.offsetWidth || 240                                 // the label stays on the screen, all of it
        const lx = dx < 0 ? Math.max(16 + lw, Math.min(W - 16, q.x + dx)) : Math.max(16, Math.min(W - 16 - lw, q.x + dx)), ly = Math.max(110, Math.min(H - 40, q.y + dy))
        el.style.opacity = 1
        line.setAttribute('x1', q.x); line.setAttribute('y1', q.y); line.setAttribute('x2', q.x + (lx - q.x) * vis); line.setAttribute('y2', q.y + (ly - q.y) * vis)
        dot.setAttribute('cx', q.x); dot.setAttribute('cy', q.y); dot.style.opacity = Math.min(1, vis * 3)
        label.style.transform = `translate(${lx}px, ${ly}px) translate(${dx < 0 ? '-100%' : '0'}, -100%) translateY(${(1 - clamp01(vis * 1.4 - 0.4)) * 10}px)`
        label.style.opacity = clamp01(vis * 1.6 - 0.6)
      }
    }
    // the sun where it really is in the sky of this view (only when it is in the picture)
    const sunDisc = ({ st, v }) => {
      const [ex, ey, ez] = v.look.eye, [wx, wy, wz] = st.world, q = st.project(ex + wx * 300, ey + wy * 300, ez + wz * 300)
      const r = 0.05 * Math.max(W, H), d = discRef.current
      d.style.opacity = light.up && q.front ? 1 : 0
      d.style.transform = `translate(${q.x - r}px, ${q.y - r}px)`; d.style.width = d.style.height = `${2 * r}px`
    }

    const tick = (time) => {
      raf = 0
      const dt = Math.min(0.1, (time - (lastT || time)) / 1000); lastT = time
      const moving = Math.abs(want - cur) > 0.0005
      if (moving) { cur = cur < 0 ? want : lerp(cur, want, 1 - Math.exp(-dt * 7)); idle = time }
      if (moving && full) { full = false; size(1) }                                // moving: one pixel per CSS px
      if (!moving && !full && time - idle > 220) { full = true; size(Math.min(window.devicePixelRatio || 1, 2)); dirty = true }   // stopped: draw it sharp
      if (moving || dirty) dirty = !draw(cur)
      if (moving || !full || dirty) raf = requestAnimationFrame(tick)
      else lastT = 0
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick) }
    const onScroll = () => { measure(); kick() }
    const onResize = () => { measure(); size(dpr); dirty = true; kick() }
    // tools/ink/film.cjs: jump to a point on the way and draw it at once (a film is made frame by frame)
    if (/film/.test(location.search)) window.__film = (t) => { full = true; size(Math.min(window.devicePixelRatio || 1, 2)); cur = want = t * TOTAL; return draw(cur) }
    measure(); size(1); cur = want; window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onResize); kick()
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize)
      free(new Set()); rtA.dispose(); rtB.dispose(); mixMat.dispose(); renderer.dispose(); renderer.forceContextLoss()
      notesEl.replaceChildren()
    }
  }, [])

  return (
    <section className="flight" style={{ height: `${(TOTAL + 1) * 100}svh` }}>
      <div ref={boxRef} className="fl-stage">
        <div ref={discRef} className="fl-disc" />
        <canvas ref={canvasRef} className="fl-canvas" role="img" aria-label="A drawing in ink of the estate, seen from a camera that moves as the page scrolls: from above, along the pool, over the pedestrian bridge." />
        <div ref={notesRef} className="fl-notes" />
        <p ref={clockRef} className="fl-clock" />
        <p ref={failRef} className="fl-fail" hidden>This browser cannot start WebGL, so the drawings cannot be shown here.</p>
      </div>
      <style>{`
        .flight { position: relative; background: ${PAPER}; }
        .fl-stage { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; background: ${PAPER}; }
        .fl-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .fl-disc { position: absolute; left: 0; top: 0; border-radius: 50%; background: ${DISC}; opacity: 0; transition: opacity .4s; }
        .fl-notes { position: absolute; inset: 0; pointer-events: none; }
        .fl-note { position: absolute; inset: 0; opacity: 0; }
        .fl-lead { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .fl-lead line { stroke: ${INK}; stroke-width: 1; }
        .fl-lead circle { fill: ${INK}; }
        .fl-label { position: absolute; left: 0; top: 0; width: max-content; max-width: min(300px, 60vw); padding: 10px 12px 12px; margin-bottom: 6px; background: rgba(239,232,218,.9); box-shadow: 0 0 0 1px rgba(33,30,26,.14); color: ${INK}; will-change: transform, opacity; }
        .fl-label b { display: block; font: 400 clamp(1.3rem, 2.4vw, 2rem)/1.1 'Cormorant Garamond', serif; }
        .fl-label span { display: block; margin-top: 6px; font: 300 13px/1.45 'Jost', sans-serif; color: rgba(33,30,26,.72); }
        .fl-clock { position: absolute; left: 16px; bottom: 12px; margin: 0; font: 400 11px/1.4 'Geist Mono', monospace; letter-spacing: .04em; color: rgba(33,30,26,.6); }
        .fl-fail { position: absolute; inset: auto 16px 40% 16px; text-align: center; font: 300 15px 'Jost', sans-serif; color: ${INK}; }
      `}</style>
    </section>
  )
}
