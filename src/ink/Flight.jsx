import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { makeRenderer, makeStage } from './stage'
import { SCENES } from './scenes'
import { MODELS } from './models'
import { adaptKit } from './adapter'
import { clockOf, dayOf, lightAt } from './light'
import { STOPS } from './route'
import { PLACES, gapOf, walk } from './world'
import { EnquireForm } from '../components/Enquire'

// One take (docs/animation-plan.md, direction A): one camera, one world, one continuous move. The eight drawn places stand
// side by side (world.js) with an imagined garden walk drawn between them, and scrolling carries the camera along a single
// smooth path from the air over the long pool to the entrance: no cuts. The world is built in pieces (chunks) as the
// camera comes near and freed behind it, so only about three places are ever held. One sun lights the whole world —
// George Town's now, as every ink drawing on the site is lit. Notes are pinned to points in each place and drawn out
// with an ink leader when the camera slows down there; the entrance holds the enquiry form.
const INK = '#211e1a', PAPER = '#efe8da', DISC = '#dba84a'
const CONN = 1.1                                                 // screens of scroll for the walk from one place to the next

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const smooth = (t) => t * t * (3 - 2 * t)

// ── the path: every stop's keys moved into the world, with two keys over each walk between them
const KEYS = [], SEGS = [], SPANS = []                           // SEGS[j]: screens of scroll from key j to j + 1
STOPS.forEach((stop, i) => {
  const at0 = [PLACES[i].x, 0, 0], keep = stop.keep ?? 0.33
  if (i) {
    const [a, b] = gapOf(i - 1)
    KEYS.push({ eye: [a + 12, 8, 42], at: [a + 32, 2, -6], fov: 40, keep: 0.33, walk: i - 1 }, { eye: [b - 12, 8, 42], at: [b + 8, 2, -6], fov: 40, keep: 0.33, walk: i - 1 })
    SEGS.push(CONN * 0.3, CONN * 0.4, CONN * 0.3)
  }
  const first = KEYS.length
  for (const k of stop.path) KEYS.push({ ...k, eye: add(k.eye, at0), at: add(k.at, at0), keep })
  for (let j = 1; j < stop.path.length; j++) SEGS.push(stop.len / (stop.path.length - 1))
  SPANS.push({ first, last: KEYS.length - 1 })
})
const TIME = SEGS.reduce((a, d) => { a.push(a.at(-1) + d); return a }, [0])        // scroll (screens) at each key
const TOTAL = TIME.at(-1)
SPANS.forEach((s) => { s.start = TIME[s.first]; s.len = TIME[s.last] - TIME[s.first] })

// centripetal Catmull–Rom (no loops or overshoot where the keys are unevenly spaced), u in [0, 1] from key j to j + 1
function crc(P, j, u) {
  const p = [P[Math.max(0, j - 1)], P[j], P[j + 1], P[Math.min(P.length - 1, j + 2)]]
  const d = (a, b) => Math.max(1e-3, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])))
  const t0 = 0, t1 = t0 + d(p[0], p[1]), t2 = t1 + d(p[1], p[2]), t3 = t2 + d(p[2], p[3]), t = t1 + (t2 - t1) * u
  const mix = (a, b, ta, tb) => a.map((v, k) => ((tb - t) * v + (t - ta) * b[k]) / (tb - ta))
  const A1 = mix(p[0], p[1], t0, t1), A2 = mix(p[1], p[2], t1, t2), A3 = mix(p[2], p[3], t2, t3)
  return mix(mix(A1, A2, t0, t2), mix(A2, A3, t1, t3), t1, t2)
}
const EYES = KEYS.map((k) => k.eye), ATS = KEYS.map((k) => k.at)
// arc length of each segment (of the eye's path), so the camera's speed can be kept smooth from one segment to the next
const TABLES = SEGS.map((_, j) => {
  const out = [0]; let prev = crc(EYES, j, 0)
  for (let i = 1; i <= 24; i++) { const q = crc(EYES, j, i / 24); out.push(out.at(-1) + Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2])); prev = q }
  return out
})
const LEN = TABLES.reduce((a, t) => { a.push(a.at(-1) + t.at(-1)); return a }, [0])   // distance flown at each key
// distance flown against scroll: a monotone cubic through (TIME, LEN), so the speed changes smoothly, never in a jump
const SLOPE = (() => {
  const n = TIME.length, dl = [], m = new Array(n).fill(0)
  for (let i = 0; i < n - 1; i++) dl.push((LEN[i + 1] - LEN[i]) / (TIME[i + 1] - TIME[i]))
  m[0] = dl[0]; m[n - 1] = dl[n - 2]
  for (let i = 1; i < n - 1; i++) m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : (2 * dl[i - 1] * dl[i]) / (dl[i - 1] + dl[i])
  return m
})()
function flownAt(s) {
  let i = 0; while (i < TIME.length - 2 && s > TIME[i + 1]) i++
  const h = TIME[i + 1] - TIME[i], t = clamp01((s - TIME[i]) / h), t2 = t * t, t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * LEN[i] + (t3 - 2 * t2 + t) * h * SLOPE[i] + (-2 * t3 + 3 * t2) * LEN[i + 1] + (t3 - t2) * h * SLOPE[i + 1]
}
/** the camera at scroll s (screens), framed for a w × h box */
function cameraAt(s, w, h) {
  const L = Math.max(0, Math.min(LEN.at(-1), flownAt(s)))
  let j = 0; while (j < SEGS.length - 1 && L > LEN[j + 1]) j++
  const tab = TABLES[j], d = L - LEN[j]
  let i = 1; while (i < tab.length - 1 && tab[i] < d) i++
  const u = clamp01((i - 1 + (d - tab[i - 1]) / Math.max(1e-6, tab[i] - tab[i - 1])) / (tab.length - 1))
  const a = KEYS[j], b = KEYS[j + 1], e = smooth(u)
  const s0 = a.shift || [0, 0], s1 = b.shift || [0, 0], keep = w >= h ? 1 : lerp(a.keep, b.keep, e)
  const look = { eye: crc(EYES, j, u), at: crc(ATS, j, u), fov: lerp(a.fov, b.fov, e), aspect: keep * (16 / 9), shift: [lerp(s0[0], s1[0], e) * keep, lerp(s0[1], s1[1], e)] }
  // the sun's shadows cover the ground around where the camera is looking
  const dy = look.at[1] - look.eye[1], k = dy < -0.01 ? Math.min(1, -look.eye[1] / dy) : 1
  const gx = lerp(look.eye[0], look.at[0], k), gz = lerp(look.eye[2], look.at[2], k)
  // on a walk: between its two keys, or the half of a segment nearest one of them
  const walk = a.walk != null && (b.walk != null || u < 0.5) ? a.walk : b.walk != null && u > 0.5 ? b.walk : null
  return { look, shadow: { x: gx, z: gz, r: Math.max(26, Math.min(70, 18 + look.eye[1] * 1.1)) }, walk, u, j }
}
const stopAt = (s) => SPANS.findIndex((sp) => s >= sp.start - 0.001 && s <= sp.start + sp.len + 0.001)
// where in the scroll (screens from the top of the section) each stop's camera is at its dwell point: for the nav links
const dwellAt = (i) => SPANS[i].start + (STOPS[i].form != null ? Math.min(0.98, STOPS[i].form + 0.2) : STOPS[i].dwell) * SPANS[i].len

export default function Flight({ onFail }) {
  const sectionRef = useRef(), boxRef = useRef(), canvasRef = useRef(), notesRef = useRef(), discRef = useRef(), clockRef = useRef(), formRef = useRef(), simpleRef = useRef(), madeRef = useRef()
  const failRef = useRef(onFail)

  useEffect(() => {
    const canvas = canvasRef.current, box = boxRef.current, section = sectionRef.current, notesEl = notesRef.current, formEl = formRef.current
    let renderer
    try { renderer = makeRenderer(canvas) } catch { failRef.current?.(); return undefined }
    renderer.shadowMap.autoUpdate = false                                      // shadows are worked out again only when the light or the view moves
    const now = Date.now(), light = lightAt(now, dayOf(now)), day = dayOf(now)
    // honest about the dark: with the sun down, the drawings keep the day's first or last light (light.js)
    clockRef.current.textContent = `George Town · ${clockOf(now)} · ` + (light.up ? 'the light in these drawings is the sun there now'
      : now < day.noon ? 'before sunrise there: drawn in first light' : 'after dark there: drawn in the day’s last light')

    const stage = makeStage(null, { view: cameraAt(0, 16, 9), ink: INK, paper: PAPER, renderer })
    // every place looks the same way (−z): one sun for all, turned to the side as each oblique drawing's own light is, so
    // the shadows fall across what is seen rather than straight behind it
    const world = stage.worldLight(light.dir, { look: { eye: [0, 0, 1], at: [0, 0, 0], fov: 40 } })

    // chunks: place i ('p' + i) and the walk after it ('w' + i), built one at a time between frames, freed behind
    const want = new Set(), queue = []
    let alive = true, near = false, busy = false
    const buildChunk = async (name) => {
      const i = +name.slice(1)
      if (name[0] === 'w') {
        const [a, b] = gapOf(i)
        stage.chunk(name, [a, 0, 0], 0, (kit) => walk(adaptKit(kit, null, { ghosts: false }), b - a))
        return
      }
      const stop = STOPS[i], M = stop.model && MODELS[stop.model], def = stop.scene && SCENES[stop.scene]
      const mod = def ? await def.load() : null
      if (!alive || !want.has(name)) return
      stage.chunk(name, [PLACES[i].x, 0, 0], 0, (kit) => {
        if (M) {
          M.build(kit)
          kit.mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2).translate(0, -0.005, 0), 0.97, { line: false, cast: false })   // its own ground
        } else {
          // drawn in full (every place on the way is the subject) but only the trees of the subject: a tree right in
          // front of a moving camera is a black trunk across the picture
          mod.default(adaptKit(kit, null, { trees: def.focusOf ? def.focusOf(mod) : def.focus, ghosts: false }))
        }
      })
    }
    const pump = async () => {
      if (busy || !alive) return
      const name = queue.shift(); if (!name) return
      busy = true
      try { if (want.has(name) && !stage.has(name)) { await buildChunk(name); dirty = true; kick() } } finally { busy = false }
      if (queue.length) setTimeout(pump, 0)
    }
    const need = (s) => {
      const at = stopAt(s), i = Math.max(0, at < 0 ? SPANS.findIndex((sp) => sp.start > s) : at)
      const names = new Set()
      for (let k = i - 1; k <= i + 1; k++) if (k >= 0 && k < STOPS.length) { names.add('p' + k); if (k < STOPS.length - 1) names.add('w' + k) }
      want.clear(); for (const n of names) want.add(n)
      for (const n of [`p${i}`, ...names]) if (!stage.has(n) && !queue.includes(n)) queue.push(n)
      for (let k = 0; k < STOPS.length; k++) for (const n of ['p' + k, 'w' + k]) if (!want.has(n) && stage.has(n)) stage.drop(n)
      pump()
    }

    // notes: built once, moved every frame
    const notes = STOPS.map((stop, i) => stop.notes.map((n) => {
      const el = document.createElement('div'); el.className = 'fl-note'
      el.innerHTML = `<svg class="fl-lead" aria-hidden="true"><line/><circle r="2.6"/></svg><div class="fl-label"><b></b><span></span></div>`
      el.querySelector('b').textContent = n.title; el.querySelector('span').textContent = n.text
      notesEl.append(el)
      return { n, p: add(n.p, [PLACES[i].x, 0, 0]), el, line: el.querySelector('line'), dot: el.querySelector('circle'), label: el.querySelector('.fl-label') }
    }))

    let W = 0, H = 0, dpr = 1, full = false, cur = -1, wantS = 0, raf = 0, idle = 0, lastT = 0, dirty = true, sized = ''
    const measure = () => {
      W = box.clientWidth; H = box.clientHeight
      const top = -section.getBoundingClientRect().top, run = section.offsetHeight - H
      wantS = clamp01(top / (run || 1)) * TOTAL
    }
    const draw = (s) => {
      need(s)
      const v = cameraAt(s, W, H), key = `${W}x${H}@${dpr}`
      if (sized !== key) { stage.resize(W, H, v, dpr); sized = key } else stage.frame(v, W, H)
      stage.render(light.dir, { world })
      const i = stopAt(s)
      notes.forEach((ns, j) => { const u = j === i ? (s - SPANS[j].start) / SPANS[j].len : -1; for (const x of ns) place(x, u) })
      sunDisc(v); formAt(i, i >= 0 ? (s - SPANS[i].start) / SPANS[i].len : 0)
      // on the walk between two places: say it is imagined
      madeRef.current.style.opacity = v.walk != null ? 1 : 0
    }
    // one note at u along its stop (u < 0: not at its stop)
    const place = ({ n, p, el, line, dot, label }, u) => {
      const vis = u < 0 ? 0 : clamp01((u - n.a) / 0.08) * clamp01((n.b - u) / 0.08), q = stage.project(...p)
      if (!q.front || vis <= 0.001) { el.style.opacity = 0; return }
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
    // the sun where it really is in the sky of this view (only when it is in the picture)
    const sunDisc = (v) => {
      const [ex, ey, ez] = v.look.eye, q = stage.project(ex + world[0] * 300, ey + world[1] * 300, ez + world[2] * 300)
      const r = 0.05 * Math.max(W, H), d = discRef.current
      d.style.opacity = light.up && q.front ? 1 : 0
      d.style.transform = `translate(${q.x - r}px, ${q.y - r}px)`; d.style.width = d.style.height = `${2 * r}px`
    }
    // the form rises beside the entrance once the camera has arrived there
    const formAt = (i, u) => {
      const stop = STOPS[i], k = stop?.form != null ? clamp01((u - stop.form) / 0.15) : 0
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
      const moving = Math.abs(wantS - cur) > 0.0005
      if (moving) { cur = cur < 0 ? wantS : lerp(cur, wantS, 1 - Math.exp(-dt * 6)); idle = time; if (dt) watch(dt) }
      if (moving && full) { full = false; dpr = 1 }                               // moving: one pixel per CSS px
      if (!moving && !full && time - idle > 220) { full = true; dpr = Math.min(window.devicePixelRatio || 1, 2); dirty = true }   // stopped: draw it sharp
      if (moving || dirty) { draw(cur); dirty = false }
      if (moving || !full || dirty) raf = requestAnimationFrame(tick)
      else lastT = 0
    }
    const kick = () => { if (!raf && near) raf = requestAnimationFrame(tick) }
    const onScroll = () => { if (!near) return; measure(); kick() }
    const onResize = () => { measure(); sized = ''; dirty = true; kick() }
    // build when the section comes within a screen; free the whole world as soon as it is a screen away
    const dropAll = () => { for (let k = 0; k < STOPS.length; k++) { stage.drop('p' + k); stage.drop('w' + k) } want.clear(); queue.length = 0 }
    const io = new IntersectionObserver(([e]) => {
      near = e.isIntersecting
      if (near) { measure(); cur = wantS; dirty = true; kick() } else { dropAll(); cancelAnimationFrame(raf); raf = 0 }
    }, { rootMargin: '100% 0px' })
    io.observe(section)
    // tools/ink/film*.cjs: jump to a point and draw it at once, sharp; true once every chunk it needs is built
    if (/film/.test(location.search)) window.__film = (t) => {
      near = true; full = true; dpr = Math.min(window.devicePixelRatio || 1, 2); measure(); cur = wantS = clamp01(t) * TOTAL
      need(cur); draw(cur); return [...want].every((n) => stage.has(n)) && !queue.length && !busy
    }
    measure(); cur = wantS
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onResize)
    return () => {
      alive = false; io.disconnect()
      cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize)
      stage.dispose(); renderer.dispose(); renderer.forceContextLoss()
      notesEl.replaceChildren()
    }
  }, [])

  return (
    <section ref={sectionRef} className="flight" style={{ height: `${(TOTAL + 1) * 100}svh` }}>
      {STOPS.map((s, i) => s.id && <div key={s.id} id={s.id} className="fl-anchor" style={{ top: `${dwellAt(i) * 100}svh` }} />)}
      <div ref={boxRef} className="fl-stage">
        <div ref={discRef} className="fl-disc" />
        <canvas ref={canvasRef} className="fl-canvas" role="img" aria-label="A drawing in ink of the estate, seen from one camera that moves as the page scrolls: from above the long pool, along the pool, over a pedestrian bridge, past the two kinds of home, through the gym and the lounge decks to the entrance." />
        <div ref={notesRef} className="fl-notes" />
        <p ref={madeRef} className="fl-made">The walk between these places is imagined. The real layout is in the masterplan.</p>
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
        .fl-made { position: absolute; left: 50%; bottom: 40px; transform: translateX(-50%); margin: 0; max-width: calc(100% - 32px); padding: 6px 12px; text-align: center; font: 300 12px/1.45 'Jost', sans-serif; color: rgba(33,30,26,.75); background: rgba(239,232,218,.9); opacity: 0; transition: opacity .5s; pointer-events: none; }
        .fl-form { position: absolute; right: max(5vw, 24px); top: 50%; transform: translateY(-46%); width: min(420px, calc(100% - 32px)); padding: 1.6rem 1.6rem 0.4rem; text-align: center; color: #2a2622; background: rgba(239,232,218,.94); box-shadow: 0 0 0 1px rgba(33,30,26,.14); opacity: 0; pointer-events: none; }
        .fl-clock { position: absolute; left: 16px; bottom: 12px; margin: 0; max-width: calc(100% - 180px); font: 400 11px/1.4 'Geist Mono', monospace; letter-spacing: .04em; color: rgba(33,30,26,.6); }
        .fl-simple { position: absolute; right: 16px; bottom: 12px; font: 400 11px/1.4 'Geist Mono', monospace; letter-spacing: .04em; color: rgba(33,30,26,.6); text-decoration: none; }
        .fl-simple-slow { display: none; }
        .fl-simple.slow { color: ${INK}; background: rgba(239,232,218,.94); padding: 6px 10px; box-shadow: 0 0 0 1px rgba(33,30,26,.3); }
        .fl-simple.slow .fl-simple-slow { display: inline; }
        @media (max-width: 700px) { .fl-form { top: auto; right: 16px; bottom: 36px; transform: none; padding: 1.1rem 1.1rem 0.2rem; } .fl-clock { display: none; } .fl-made { bottom: 36px; } }
      `}</style>
    </section>
  )
}
