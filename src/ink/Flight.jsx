import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { makeRenderer, makeStage } from './stage'
import { SCENES } from './scenes'
import { MODELS } from './models'
import { adaptKit } from './adapter'
import { clockOf, dayOf, lightAt } from './light'
import { STOPS } from './route'
import { EnquireForm } from '../components/Enquire'

// One take (docs/animation-plan.md, direction A): scrolling moves one camera through the estate, stop by stop (route.js).
// Each stop is its own ink scene; at most two are alive at a time (this one and the next), and the change from one to
// the next is made dot by dot: the old drawing breaks into dots that shrink while the new one's dots grow. The light is
// George Town's sun now, fixed in the world for each stop so the shadows stay put while the camera moves. Notes are
// pinned to points in the scene and drawn out with an ink leader when the camera slows down there. The last stop, the
// entrance, holds the enquiry form. Nothing is drawn, and nothing is held on the GPU, while the section is a screen away.
const INK = '#211e1a', PAPER = '#efe8da', DISC = '#dba84a'
const T = 0.45                                                   // screens of scroll over which one stop turns into the next
const START = STOPS.reduce((a, s, i) => { a.push(i ? a[i - 1] + STOPS[i - 1].len - T : 0); return a }, [])
export const TOTAL = START.at(-1) + STOPS.at(-1).len

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t))
const uneased = (u) => Math.acos(1 - 2 * u) / Math.PI                   // the scroll share at which ease() reaches u
// Catmull–Rom through the keys; u in [0, 1]
function along(keys, u) {
  const n = keys.length - 1, f = clamp01(u) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i
  const K = (j) => keys[Math.max(0, Math.min(n, j))]
  const cr = (p0, p1, p2, p3) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
  const v = (k) => [0, 1, 2].map((d) => cr(K(i - 1)[k][d], K(i)[k][d], K(i + 1)[k][d], K(i + 2)[k][d]))
  const s0 = K(i).shift || [0, 0], s1 = K(i + 1).shift || [0, 0], e = ease(t)
  return { eye: v('eye'), at: v('at'), fov: lerp(K(i).fov, K(i + 1).fov, e), shift: [lerp(s0[0], s1[0], e), lerp(s0[1], s1[1], e)] }
}
// framed at 16:9: a wider screen keeps the keys' horizontal angle; a tall phone screen keeps a share of it (stop.keep)
const lookAt = (stop, u, w, h) => {
  const k = along(stop.path, u), keep = w >= h ? 1 : stop.keep ?? 0.33
  return { look: { ...k, aspect: keep * (16 / 9), shift: [k.shift[0] * keep, k.shift[1]] }, shadow: stop.shadow }   // a sideways slide narrows with the view
}
// where in the scroll (in screens from the top of the section) a stop's camera is at its dwell point: for the nav links
const dwellAt = (i) => START[i] + uneased(STOPS[i].form != null ? Math.min(0.98, STOPS[i].form + 0.2) : STOPS[i].dwell) * STOPS[i].len

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

export default function Flight({ onFail }) {
  const sectionRef = useRef(), boxRef = useRef(), canvasRef = useRef(), notesRef = useRef(), discRef = useRef(), clockRef = useRef(), formRef = useRef(), simpleRef = useRef()
  const failRef = useRef(onFail)

  useEffect(() => {
    const canvas = canvasRef.current, box = boxRef.current, section = sectionRef.current, notesEl = notesRef.current, formEl = formRef.current
    let renderer
    try { renderer = makeRenderer(canvas) } catch { failRef.current?.(); return undefined }
    renderer.shadowMap.autoUpdate = false                                      // shadows are worked out again only when a light moves
    const now = Date.now(), light = lightAt(now, dayOf(now))
    clockRef.current.textContent = `George Town · ${clockOf(now)} · the light in these drawings is the sun there now`

    // the two drawings being mixed, and the full-screen pass that mixes them dot by dot
    const rt = () => { const r = new THREE.WebGLRenderTarget(4, 4, { samples: 0 }); r.texture.colorSpace = THREE.SRGBColorSpace; return r }
    const rtA = rt(), rtB = rt()
    const mixMat = new THREE.ShaderMaterial({
      uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uRes: { value: new THREE.Vector2() }, uDpr: { value: 1 }, uCell: { value: 4 }, uMix: { value: 0 }, uDir: { value: new THREE.Vector2(0, 1) } },
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: MIX_FS, depthTest: false, depthWrite: false, transparent: true, blending: THREE.NoBlending,
    })
    const mixScene = new THREE.Scene(); mixScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mixMat))
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // stops: built when needed (this one and the next), freed as soon as they are behind
    let alive = true, near = false
    const live = new Map(), building = new Set()
    const build = async (i) => {
      if (i < 0 || i >= STOPS.length || live.has(i) || building.has(i)) return
      building.add(i)
      const stop = STOPS[i], M = stop.model && MODELS[stop.model], def = stop.scene && SCENES[stop.scene]
      const mod = def ? await def.load() : null
      if (!alive || !near) { building.delete(i); return }
      const st = makeStage(null, { view: lookAt(stop, 0, 16, 9), ink: INK, paper: PAPER, renderer })
      // a scene is drawn in full (on the way through, everything is the subject), but keeps only the trees of its
      // subject: a tree right in front of a moving camera is a black trunk across the picture
      if (M) M.build(st.kit)
      else mod.default(adaptKit(st.kit, null, { trees: def.focusOf ? def.focusOf(mod) : def.focus }))
      st.finish()
      // the light, fixed in the world for the whole stop; a square-on house takes it as its own drawing does
      st.world = stop.light === 'square' ? light.dir : st.worldLight(light.dir, lookAt(stop, stop.dwell, 16, 9))
      st.sized = null
      building.delete(i); live.set(i, st); dirty = true; kick()
    }
    const free = (keep) => { for (const [i, st] of live) if (!keep.has(i)) { st.dispose(); live.delete(i) } }

    // notes: built once, moved every frame
    const notes = STOPS.map((stop) => stop.notes.map((n) => {
      const el = document.createElement('div'); el.className = 'fl-note'
      el.innerHTML = `<svg class="fl-lead" aria-hidden="true"><line/><circle r="2.6"/></svg><div class="fl-label"><b></b><span></span></div>`
      el.querySelector('b').textContent = n.title; el.querySelector('span').textContent = n.text
      notesEl.append(el); return { n, el, line: el.querySelector('line'), dot: el.querySelector('circle'), label: el.querySelector('.fl-label') }
    }))

    let W = 0, H = 0, dpr = 1, full = false, cur = -1, want = 0, raf = 0, idle = 0, lastT = 0, dirty = true
    const measure = () => {
      W = box.clientWidth; H = box.clientHeight
      const top = -section.getBoundingClientRect().top, run = section.offsetHeight - H
      want = clamp01(top / (run || 1)) * TOTAL
    }
    const size = (d) => {
      dpr = d
      for (const r of [rtA, rtB]) r.setSize(Math.round(W * d), Math.round(H * d))
      mixMat.uniforms.uRes.value.set(W * d, H * d); mixMat.uniforms.uDpr.value = d; mixMat.uniforms.uCell.value = Math.max(3.5, Math.min(5.5, W / 260))   // about two grains of the stipple
    }
    const draw = (t) => {
      const on = STOPS.map((_, i) => i).filter((i) => t >= START[i] - 0.001 && t <= START[i] + STOPS[i].len + 0.001)
      if (!on.length) return false
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
      let main, shown = []
      if (ready.length === 2) {
        const [a, b] = ready, m = clamp01((t - START[b]) / T)
        const A = show(a, rtA), B = show(b, rtB)
        mixMat.uniforms.uMix.value = m
        renderer.setRenderTarget(null); renderer.clear(); renderer.render(mixScene, quadCam)
        main = m < 0.5 ? A : B
        place(A, 1 - ease(m * 2)); place(B, ease(m * 2 - 1)); shown = [a, b]
      } else {
        main = show(ready[0], null); place(main, 1); shown = [ready[0]]
      }
      for (const [j, ns] of notes.entries()) if (!shown.includes(j)) for (const x of ns) x.el.style.opacity = 0
      sunDisc(main)
      formAt(main)
      return true
    }
    // the notes of one stop, faded by k
    const place = ({ st, stop, u }, k) => {
      for (const { n, el, line, dot, label } of notes[STOPS.indexOf(stop)]) {
        const vis = k * clamp01((u - n.a) / 0.08) * clamp01((n.b - u) / 0.08), q = st.project(...n.p)
        if (!q.front || vis <= 0.001) { el.style.opacity = 0; continue }
        const phone = W < 700, { dx, dy } = phone ? n.m || { dx: n.dx * 0.55, dy: n.dy * 0.7 } : n, up = dy < 0
        const lw = label.offsetWidth || 240, lh = label.offsetHeight || 80, nav = phone ? 70 : 92   // the label stays on the screen, below the bar
        const lx = dx < 0 ? Math.max(16 + lw, Math.min(W - 16, q.x + dx)) : Math.max(16, Math.min(W - 16 - lw, q.x + dx))
        const ly = up ? Math.max(nav + lh, Math.min(H - 40, q.y + dy)) : Math.max(nav, Math.min(H - 40 - lh, q.y + dy))
        el.style.opacity = 1
        line.setAttribute('x1', q.x); line.setAttribute('y1', q.y); line.setAttribute('x2', q.x + (lx - q.x) * vis); line.setAttribute('y2', q.y + (ly - q.y) * vis)
        dot.setAttribute('cx', q.x); dot.setAttribute('cy', q.y); dot.style.opacity = Math.min(1, vis * 3)
        label.style.transform = `translate(${lx}px, ${ly}px) translate(${dx < 0 ? '-100%' : '0'}, ${up ? '-100%' : '0'}) translateY(${(1 - clamp01(vis * 1.4 - 0.4)) * 10}px)`
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
    // the form rises in front of the entrance once the camera has arrived there
    const formAt = ({ stop, u }) => {
      const k = stop.form != null ? clamp01((u - stop.form) / 0.15) : 0
      formEl.style.opacity = k; formEl.style.translate = `0 ${(1 - k) * 24}px`
      formEl.style.pointerEvents = k > 0.6 ? 'auto' : 'none'; formEl.inert = k < 0.6
    }

    // too slow here (a frame takes over 45 ms while moving): offer the simpler page, do not switch behind anyone's back
    const gaps = []
    const watch = (dt) => {
      if (gaps.length >= 40) return
      gaps.push(dt)
      if (gaps.length === 40 && gaps.slice().sort((a, b) => a - b)[20] > 0.045) simpleRef.current.classList.add('slow')
    }

    const tick = (time) => {
      raf = 0
      if (!near) return
      const dt = Math.min(0.1, (time - (lastT || time)) / 1000); lastT = time
      const moving = Math.abs(want - cur) > 0.0005
      if (moving) { cur = cur < 0 ? want : lerp(cur, want, 1 - Math.exp(-dt * 7)); idle = time; if (dt) watch(dt) }
      if (moving && full) { full = false; size(1) }                                // moving: one pixel per CSS px
      if (!moving && !full && time - idle > 220) { full = true; size(Math.min(window.devicePixelRatio || 1, 2)); dirty = true }   // stopped: draw it sharp
      if (moving || dirty) dirty = !draw(cur)
      if (moving || !full || dirty) raf = requestAnimationFrame(tick)
      else lastT = 0
    }
    const kick = () => { if (!raf && near) raf = requestAnimationFrame(tick) }
    const onScroll = () => { if (!near) return; measure(); kick() }
    const onResize = () => { measure(); size(dpr); dirty = true; kick() }
    // build when the section comes within a screen; free everything as soon as it is a screen away
    const io = new IntersectionObserver(([e]) => {
      near = e.isIntersecting
      if (near) { measure(); cur = want; dirty = true; kick() } else { free(new Set()); cancelAnimationFrame(raf); raf = 0 }
    }, { rootMargin: '100% 0px' })
    io.observe(section)
    // tools/ink/film.cjs: jump to a point on the way and draw it at once (a film is made frame by frame)
    if (/film/.test(location.search)) window.__film = (t) => { near = true; full = true; measure(); size(Math.min(window.devicePixelRatio || 1, 2)); cur = want = clamp01(t) * TOTAL; return draw(cur) }
    measure(); size(1); cur = want
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onResize)
    return () => {
      alive = false; io.disconnect()
      cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize)
      free(new Set()); rtA.dispose(); rtB.dispose(); mixMat.dispose(); renderer.dispose(); renderer.forceContextLoss()
      notesEl.replaceChildren()
    }
  }, [])

  return (
    <section ref={sectionRef} className="flight" style={{ height: `${(TOTAL + 1) * 100}svh` }}>
      {STOPS.map((s, i) => s.id && <div key={s.id} id={s.id} className="fl-anchor" style={{ top: `${dwellAt(i) * 100}svh` }} />)}
      <div ref={boxRef} className="fl-stage">
        <div ref={discRef} className="fl-disc" />
        <canvas ref={canvasRef} className="fl-canvas" role="img" aria-label="A drawing in ink of the estate, seen from a camera that moves as the page scrolls: from above, along the pool, over a pedestrian bridge, to the two kinds of home, the gym, the lounge decks and the entrance." />
        <div ref={notesRef} className="fl-notes" />
        <div ref={formRef} className="fl-form"><EnquireForm compact /></div>
        <p ref={clockRef} className="fl-clock" />
        <a ref={simpleRef} className="fl-simple" href="?sections"><span className="fl-simple-slow">This looks slow here: </span>simpler page →</a>
      </div>
      <style>{`
        .flight { position: relative; background: ${PAPER}; }
        .fl-anchor { position: absolute; left: 0; width: 1px; height: 1px; }
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
        .fl-form { position: absolute; right: max(5vw, 24px); top: 50%; transform: translateY(-46%); width: min(420px, calc(100% - 32px)); padding: 1.6rem 1.6rem 0.4rem; text-align: center; color: #2a2622; background: rgba(239,232,218,.94); box-shadow: 0 0 0 1px rgba(33,30,26,.14); opacity: 0; pointer-events: none; }
        .fl-clock { position: absolute; left: 16px; bottom: 12px; margin: 0; max-width: calc(100% - 180px); font: 400 11px/1.4 'Geist Mono', monospace; letter-spacing: .04em; color: rgba(33,30,26,.6); }
        .fl-simple { position: absolute; right: 16px; bottom: 12px; font: 400 11px/1.4 'Geist Mono', monospace; letter-spacing: .04em; color: rgba(33,30,26,.6); text-decoration: none; }
        .fl-simple-slow { display: none; }
        .fl-simple.slow { color: ${INK}; background: rgba(239,232,218,.94); padding: 6px 10px; box-shadow: 0 0 0 1px rgba(33,30,26,.3); }
        .fl-simple.slow .fl-simple-slow { display: inline; }
        @media (max-width: 700px) { .fl-form { top: auto; right: 16px; bottom: 36px; transform: none; padding: 1.1rem 1.1rem 0.2rem; } .fl-clock { display: none; } }
      `}</style>
    </section>
  )
}
