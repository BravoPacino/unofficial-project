import { useEffect, useMemo, useRef, useState } from 'react'
import { makeRenderer, makeStage } from './stage'
import { adaptKit } from './adapter'
import { clockOf, dayOf, sunWorld } from './light'
import { estate } from './estate'
import { greenWall, water, deck, cabanas, gym, ownDesigns, edges, facades } from './valley'
import { gate, drive, south } from './places'
import { MODELS } from './models'
import { makePath } from './path'
import { KEYS, NOTES, HERO_KEYS, HERO_NOTES, FORM, ANCHORS, HOME, VILLA } from './take-route'
import PlanDraw from './PlanDraw'
import { COORD } from '../data/site'
import { STOPS } from './stops'
import { U, W as W_ } from './site'
import plan from '../data/sitePlan.js'
import { EnquireForm } from '../components/Enquire'

// The one take on the masterplan (docs/world-plan.md): one camera through the estate as the plan lays it out, from the
// plan seen from above to the gate, up onto the podium, along the east drive and its bridges, down the planted wall into
// the pool valley, through the floating gym, over the splash pool, and out to a Courtyard Home and a Courtyard Villa. The
// estate stands in mass (estate.js); where the camera passes it is drawn in full, built in pieces as the camera comes
// near and freed behind it. The sun is George Town's now, from its real bearing (the plan has a north). A small copy of
// the plan in the corner shows where the camera is.
const INK = '#211e1a', PAPER = '#efe8da', DISC = '#dba84a'
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
// the hero (docs/hero-plan.md): the take starts with the plan drawing itself on paper, then the homes rising out of it.
// Only on the sample page (sample.html?hero) until the user has seen it.
const HERO = /hero/.test(import.meta.env.VITE_SAMPLE || (typeof location === 'undefined' ? '' : location.search))
const ROUTE = HERO ? HERO_KEYS : KEYS, NOTE_LIST = HERO ? HERO_NOTES : NOTES
const PATH = makePath(ROUTE), TOTAL = PATH.TOTAL
const timeOf = ([id, off = 0]) => PATH.TIME[ROUTE.findIndex((k) => k.id === id)] + off
const smooth = (t) => t * t * (3 - 2 * t)
// hero: how tall the estate stands at scroll s (screens). At least 4% while the drawing shows (fully flat faces flicker)
const T_RISE = HERO ? timeOf(['rise']) : 0, T_AIR = HERO ? timeOf(['aerial']) : 0
const heightAt = (s) => (s < T_RISE ? 0.04 + 0.26 * smooth(clamp01(s / T_RISE)) : 0.3 + 0.7 * smooth(clamp01((s - T_RISE) / (T_AIR - T_RISE))))

// the pieces drawn in full, each over a box of the world (x0, x1, z0, z1): built while the camera is within R of it
// (less far ahead on a phone, where the GPU memory a page may hold is smaller)
const R = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 700px)').matches ? 80 : 110
const PIECES = [
  { name: 'gate', box: [-50, 45, 85, 150], build: (k) => gate(k) },
  { name: 'driveS', box: [36, 57, 20, 95], build: (k) => drive(k, 20, 95) },
  { name: 'driveM', box: [36, 57, -50, 20], build: (k) => drive(k, -50, 20) },
  { name: 'driveN', box: [-20, 57, -118, -50], build: (k) => drive(k, -118, -50) },
  { name: 'vN', box: [-14, 6, -112, -60], build: (k, eye) => { greenWall(k); water(k, -112, -60); deck(k, eye); edges(k, -112, -60); facades(k, -112, -60) } },
  { name: 'vM', box: [-14, 6, -60, -6], build: (k, eye) => { water(k, -60, -6); cabanas(k); gym(k, eye); edges(k, -60, -6); facades(k, -60, -6) } },
  { name: 'vS', box: [-14, 6, -6, 95], build: (k) => { water(k, -6, 95); ownDesigns(k); south(k); edges(k, -6, 95, (z) => Math.abs(z - VILLA.at[2]) < 13); facades(k, -6, 95, VILLA.plots) } },
  { name: 'home', box: [-90, -60, 20, 55], at: HOME, model: 'homes' },
  { name: 'villa', box: [-30, 6, 60, 100], at: VILLA, model: 'villas' },
]
const dist = ([x, , z], [x0, x1, z0, z1]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1))

export default function Take({ onFail }) {
  const planRef = useRef(), heroRef = useRef(), mapBoxRef = useRef(), sectionRef = useRef(), boxRef = useRef(), canvasRef = useRef(), notesRef = useRef(), discRef = useRef(), clockRef = useRef(), camRef = useRef(), formRef = useRef(), simpleRef = useRef()
  const failRef = useRef(onFail)
  const [mapOpen, setMapOpen] = useState(true)
  const route = useMemo(() => Array.from({ length: 241 }, (_, i) => { const e = PATH.cameraAt((i / 240) * TOTAL, 16, 9).look.eye; return U(e[0], e[2]) }), [])

  useEffect(() => {
    const canvas = canvasRef.current, box = boxRef.current, section = sectionRef.current, notesEl = notesRef.current, formEl = formRef.current
    let renderer
    try { renderer = makeRenderer(canvas) } catch { failRef.current?.(); return undefined }
    renderer.shadowMap.autoUpdate = false
    const now = Date.now(), sun = sunWorld(now), day = dayOf(now)
    clockRef.current.textContent = `George Town · ${clockOf(now)} · ` + (sun.up ? 'the light here is the sun there now, from where it really stands'
      : now < day.noon ? 'before sunrise there: drawn in first light' : 'after dark there: drawn in the day’s last light')

    const stage = makeStage(null, { view: PATH.cameraAt(0, 16, 9), ink: INK, paper: PAPER, renderer })
    const eye0 = ROUTE[0].eye
    const skip = (p) => HOME.plots(p)
    let alive = true, near = false, busy = false, dirty = true, raf = 0
    const want = new Set(), queue = []
    const buildEstate = () => { if (!stage.has('estate')) stage.chunk('estate', [0, 0, 0], 0, (kit) => estate(kit, { trim: 12.4, skip })) }
    const pump = () => {
      if (busy || !alive) return
      const name = queue.shift(); if (!name) return
      busy = true
      try {
        const piece = PIECES.find((p) => p.name === name)
        if (want.has(name) && !stage.has(name)) {
          if (piece.model) stage.chunk(name, piece.at.at, piece.at.ry, (kit) => MODELS[piece.model].build(kit))
          else stage.chunk(name, [0, 0, 0], 0, (kit) => piece.build(adaptKit(kit, null, { ghosts: false }), eye0))
          dirty = true; kick()
        }
      } finally { busy = false }
      if (queue.length) setTimeout(pump, 0)
    }
    const need = (eye) => {
      want.clear()
      for (const p of PIECES) if (dist(eye, p.box) < R && eye[1] < 120) want.add(p.name)
      for (const n of want) if (!stage.has(n) && !queue.includes(n)) queue.push(n)
      for (const p of PIECES) if (!want.has(p.name) && stage.has(p.name)) stage.drop(p.name)
      if (queue.length) setTimeout(pump, 0)
    }

    const notes = NOTE_LIST.map((n) => {
      const el = document.createElement('div'); el.className = 'tk-note'
      el.innerHTML = `<svg class="tk-lead" aria-hidden="true"><line/><circle r="2.6"/></svg><div class="tk-label"><b></b><span></span></div>`
      el.querySelector('b').textContent = n.title + (n.own ? ' ○' : '')
      el.querySelector('span').textContent = n.text
      if (!n.text) el.querySelector('span').remove()
      notesEl.append(el)
      return { n, t0: timeOf(n.from), t1: timeOf(n.to), el, line: el.querySelector('line'), dot: el.querySelector('circle'), label: el.querySelector('.tk-label') }
    })
    const formT = timeOf(FORM)

    let W = 0, H = 0, dpr = 1, full = false, cur = -1, wantS = 0, idle = 0, lastT = 0, sized = ''
    const measure = () => {
      W = box.clientWidth; H = box.clientHeight
      const top = -section.getBoundingClientRect().top, run = section.offsetHeight - H
      wantS = clamp01(top / (run || 1)) * TOTAL
    }
    // hero: the drawn plan laid exactly on the estate seen from above (an affine fit through three plan corners at y = 0)
    const fitPlan = () => {
      const q = [[20, 20], [500, 20], [20, 770]].map(([sx, sy]) => { const [x, z] = W_(sx, sy); return stage.project(x, 0, z) })
      const a = (q[1].x - q[0].x) / 480, b = (q[1].y - q[0].y) / 480, c = (q[2].x - q[0].x) / 750, d = (q[2].y - q[0].y) / 750
      planRef.current.setAttribute('transform', `matrix(${a} ${b} ${c} ${d} ${q[0].x - 20 * a - 20 * c} ${q[0].y - 20 * b - 20 * d})`)
      planRef.current.style.strokeWidth = (1.1 / Math.hypot(a, b)).toFixed(3)
    }
    let drawn = !HERO || matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!drawn) setTimeout(() => { drawn = true; dirty = true; kick() }, 2700)      // the plan has finished drawing itself
    const draw = (s) => {
      const v = PATH.cameraAt(s, W, H)
      const key = `${W}x${H}@${dpr}`
      if (sized !== key) { stage.resize(W, H, v, dpr); sized = key } else stage.frame(v, W, H)
      if (HERO) {
        const show = clamp01((s - 0.03) / 0.15)
        canvas.style.opacity = show.toFixed(3)
        planRef.current.parentNode.style.opacity = (1 - clamp01((s - 0.06) / 0.2)).toFixed(3)
        heroRef.current.style.opacity = (1 - clamp01((s - 0.08) / 0.3)).toFixed(3)
        heroRef.current.style.visibility = s > 0.4 ? 'hidden' : ''
        mapBoxRef.current.style.opacity = clamp01((s - T_AIR + 0.3) / 0.3).toFixed(3)
        if (s < 0.4) fitPlan()
        // while the plan is still drawing itself and nobody has scrolled, build nothing: building the estate takes the main
        // thread for a moment, and the drawing (a CSS animation) would stop
        if (!drawn && s < 0.03) return
      }
      buildEstate()
      if (HERO) stage.stretch('estate', heightAt(s))
      need(v.look.eye)
      stage.render([0, 0, 0.8], { world: sun.dir })
      for (const x of notes) place(x, s)
      sunDisc(v)
      const k = clamp01((s - formT) / 0.3)
      formEl.style.opacity = k; formEl.style.translate = `0 ${(1 - k) * 24}px`
      formEl.style.pointerEvents = k > 0.6 ? 'auto' : 'none'; formEl.inert = k < 0.6
      const [ex, , ez] = v.look.eye, [ax, , az] = v.look.at, [mx, my] = U(ex, ez), hd = Math.atan2(az - ez, ax - ex) * 180 / Math.PI
      camRef.current?.setAttribute('transform', `translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${hd.toFixed(1)})`)
    }
    const place = ({ n, t0, t1, el, line, dot, label }, s) => {
      const vis = clamp01((s - t0) / 0.15) * clamp01((t1 - s) / 0.15), q = stage.project(...n.p)
      if (!q.front || vis <= 0.001) { el.style.opacity = 0; return }
      const phone = W < 700, { dx, dy } = phone ? n.m || { dx: n.dx * 0.55, dy: n.dy * 0.7 } : n, up = dy < 0
      const lw = label.offsetWidth || 220, lh = label.offsetHeight || 60, nav = phone ? 70 : 92
      const lx = dx < 0 ? Math.max(16 + lw, Math.min(W - 16, q.x + dx)) : Math.max(16, Math.min(W - 16 - lw, q.x + dx))
      const ly = up ? Math.max(nav + lh, Math.min(H - 60, q.y + dy)) : Math.max(nav, Math.min(H - 60 - lh, q.y + dy))
      el.style.opacity = 1
      line.setAttribute('x1', q.x); line.setAttribute('y1', q.y); line.setAttribute('x2', q.x + (lx - q.x) * vis); line.setAttribute('y2', q.y + (ly - q.y) * vis)
      dot.setAttribute('cx', q.x); dot.setAttribute('cy', q.y); dot.style.opacity = Math.min(1, vis * 3)
      label.style.transform = `translate(${lx}px, ${ly}px) translate(${dx < 0 ? '-100%' : '0'}, ${up ? '-100%' : '0'}) translateY(${(1 - clamp01(vis * 1.4 - 0.4)) * 10}px)`
      label.style.opacity = clamp01(vis * 1.6 - 0.6)
    }
    const sunDisc = (v) => {
      const [ex, ey, ez] = v.look.eye, d = sun.dir, q = stage.project(ex + d[0] * 300, ey + d[1] * 300, ez + d[2] * 300)
      const r = 0.05 * Math.max(W, H), el = discRef.current
      el.style.opacity = sun.up && q.front && (!HERO || v.look.eye[1] < 200) ? 1 : 0
      el.style.transform = `translate(${q.x - r}px, ${q.y - r}px)`; el.style.width = el.style.height = `${2 * r}px`
    }
    // too slow here (a frame takes over 45 ms while moving): offer the simpler page, do not switch behind anyone's back
    const gaps = []
    const watch = (dt) => { if (gaps.length >= 40) return; gaps.push(dt); if (gaps.length === 40 && gaps.slice().sort((a, b) => a - b)[20] > 0.045) simpleRef.current.classList.add('slow') }

    const tick = (time) => {
      raf = 0
      if (!near) return
      const dt = Math.min(0.1, (time - (lastT || time)) / 1000); lastT = time
      const moving = Math.abs(wantS - cur) > 0.0005
      if (moving) { cur = cur < 0 ? wantS : lerp(cur, wantS, 1 - Math.exp(-dt * 6)); idle = time; if (dt) watch(dt) }
      if (moving && full) { full = false; dpr = 1 }
      if (!moving && !full && time - idle > 220) { full = true; dpr = Math.min(window.devicePixelRatio || 1, 2); dirty = true }
      if (moving || dirty) { draw(cur); dirty = false }
      if (moving || !full || dirty) raf = requestAnimationFrame(tick)
      else lastT = 0
    }
    function kick() { if (!raf && near) raf = requestAnimationFrame(tick) }
    const onScroll = () => { if (!near) return; measure(); kick() }
    const onResize = () => { measure(); sized = ''; dirty = true; kick() }
    // build when the section comes within a screen; free all of it as soon as it is a screen away
    const io = new IntersectionObserver(([e]) => {
      near = e.isIntersecting
      if (near) { measure(); cur = wantS; dirty = true; kick() }
      else { for (const p of PIECES) stage.drop(p.name); stage.drop('estate'); want.clear(); queue.length = 0; cancelAnimationFrame(raf); raf = 0 }
    }, { rootMargin: '100% 0px' })
    io.observe(section)
    if (/film/.test(location.search)) window.__film = (t) => {
      near = true; full = true; dpr = Math.min(window.devicePixelRatio || 1, 2); measure(); cur = wantS = clamp01(t) * TOTAL
      draw(cur); return [...want].every((n) => stage.has(n)) && !queue.length && !busy
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

  const mapLines = useMemo(() => plan.lines.filter((l) => !l[4]).map(([x1, y1, x2, y2]) => `M${x1} ${y1}L${x2} ${y2}`).join(''), [])
  return (
    <section ref={sectionRef} className="take" style={{ height: `${(TOTAL + 1) * 100}svh` }}>
      {Object.entries(ANCHORS).map(([id, key]) => <div key={id} id={id} className="tk-anchor" style={{ top: `${timeOf([key]) * 100}svh` }} />)}
      {STOPS.map((st) => <div key={st.key} id={`stop-${st.key}`} className="tk-anchor" style={{ top: `${timeOf([st.key]) * 100}svh` }} />)}
      <div ref={boxRef} className="tk-stage">
        <div ref={discRef} className="tk-disc" />
        {HERO && <PlanDraw gRef={planRef} />}
        <canvas ref={canvasRef} className="tk-canvas" role="img" aria-label="A drawing in ink of the estate as its masterplan lays it out, seen from one camera that moves as the page scrolls: from above, to the gate, along the walkway level and its bridges, down into the pool valley and through the floating gym, to a Courtyard Home and a Courtyard Villa." />
        <div ref={notesRef} className="tk-notes" />
        {HERO && (
          <div ref={heroRef} className="tk-hero">
            <p className="tk-hero-meta">Unofficial concept <span>·</span> George Town, Penang</p>
            <h1 className="tk-hero-title">A <em>Sanctuary</em><br />Above All</h1>
            <p className="tk-hero-sub">239 exclusive residences within Penang&rsquo;s most coveted enclave. Where nature&rsquo;s splendour meets timeless luxury.</p>
            <p className="tk-hero-coord">{COORD}</p>
            <p className="tk-hero-hint">Scroll to walk in <span aria-hidden="true">↓</span></p>
          </div>
        )}
        <div ref={mapBoxRef} className="tk-mapbox"><button type="button" className={mapOpen ? 'tk-map' : 'tk-map tk-map-closed'} onClick={() => setMapOpen((o) => !o)} aria-label={mapOpen ? 'Hide the little map' : 'Show the little map'}>
          <svg viewBox="20 20 480 750" aria-hidden="true">
            <path d={mapLines} />
            <polyline className="tk-route" points={route.map((p) => p.join(',')).join(' ')} />
            <g ref={camRef}><path className="tk-cone" d="M0 0 L42 -16 L42 16 Z" /><circle r="7" /></g>
          </svg>
        </button></div>
        <div ref={formRef} className="tk-form"><EnquireForm compact /></div>
        <p className="tk-made">Laid out from the developer’s masterplan. Heights, and which home or bridge each drawing shows, are our reading; ○ marks a facility with no published image, drawn in our own hand.</p>
        <p ref={clockRef} className="tk-clock" />
        <a ref={simpleRef} className="tk-simple" href="?sections"><span className="tk-simple-slow">This looks slow here: </span>simpler page →</a>
      </div>
      <style>{`
        .take { position: relative; background: ${PAPER}; }
        .tk-anchor { position: absolute; left: 0; width: 1px; height: 1px; }
        .tk-stage { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; background: ${PAPER}; }
        .tk-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .take .plan-draw { z-index: 0; }
        .tk-hero { position: absolute; left: max(5vw, 24px); top: 50%; transform: translateY(-50%); width: min(36vw, 480px); color: ${INK}; pointer-events: none; }
        .tk-hero p { margin: 0; }
        .tk-hero-meta { font: 400 10px/1.4 'Jost', sans-serif; letter-spacing: .28em; text-transform: uppercase; color: rgba(33,30,26,.62); }
        .tk-hero-meta span { margin: 0 .5em; }
        .tk-hero-title { margin: .45em 0 .5em; font: 300 clamp(2.8rem, 6vw, 5.6rem)/1.02 'Cormorant Garamond', serif; letter-spacing: -.01em; }
        .tk-hero-title em { font-style: italic; }
        .tk-hero-sub { max-width: 30em; font: 300 14px/1.6 'Jost', sans-serif; color: rgba(33,30,26,.75); }
        .tk-hero-coord { margin-top: 1.2em !important; font: 400 11px/1.4 'Geist Mono', monospace; letter-spacing: .04em; color: rgba(33,30,26,.55); }
        .tk-hero-hint { margin-top: 2.2em !important; font: 400 10px/1.4 'Jost', sans-serif; letter-spacing: .24em; text-transform: uppercase; }
        .tk-hero-hint span { display: inline-block; margin-left: .4em; animation: tk-bob 1.8s ease-in-out infinite; }
        @keyframes tk-bob { 50% { transform: translateY(4px); } }
        @media (prefers-reduced-motion: no-preference) {
          .tk-hero > * { opacity: 0; animation: tk-in .9s ease-out forwards; }
          .tk-hero-meta { animation-delay: .7s !important; } .tk-hero-title { animation-delay: 1.1s !important; } .tk-hero-sub { animation-delay: 1.6s !important; }
          .tk-hero-coord { animation-delay: 1.9s !important; } .tk-hero-hint { animation-delay: 2.5s !important; }
        }
        @keyframes tk-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .tk-disc { position: absolute; left: 0; top: 0; border-radius: 50%; background: ${DISC}; opacity: 0; transition: opacity .4s; }
        .tk-notes { position: absolute; inset: 0; pointer-events: none; }
        .tk-note { position: absolute; inset: 0; opacity: 0; }
        .tk-lead { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .tk-lead line { stroke: ${INK}; stroke-width: 1; }
        .tk-lead circle { fill: ${INK}; }
        .tk-label { position: absolute; left: 0; top: 0; width: max-content; max-width: min(300px, 60vw); padding: 10px 12px 11px; background: rgba(239,232,218,.9); box-shadow: 0 0 0 1px rgba(33,30,26,.14); color: ${INK}; will-change: transform, opacity; }
        .tk-label b { display: block; font: 400 clamp(1.2rem, 2.2vw, 1.8rem)/1.1 'Cormorant Garamond', serif; }
        .tk-label span { display: block; margin-top: 6px; font: 300 13px/1.45 'Jost', sans-serif; color: rgba(33,30,26,.72); }
        .tk-map { position: absolute; right: 16px; top: 96px; width: 120px; padding: 6px; border: 0; background: rgba(239,232,218,.92); box-shadow: 0 0 0 1px rgba(33,30,26,.18); cursor: pointer; transition: width .3s; }
        .tk-map svg { display: block; width: 100%; height: auto; }
        .tk-map path { fill: none; stroke: rgba(33,30,26,.45); stroke-width: 1.4; }
        .tk-map .tk-route { fill: none; stroke: ${INK}; stroke-width: 4; stroke-dasharray: 2 8; stroke-linecap: round; }
        .tk-map circle { fill: ${DISC}; stroke: ${INK}; stroke-width: 3; }
        .tk-map .tk-cone { fill: rgba(219,168,74,.45); stroke: none; }
        .tk-map-closed { width: 34px; }
        .tk-form { position: absolute; right: max(5vw, 24px); top: 50%; transform: translateY(-46%); width: min(420px, calc(100% - 32px)); padding: 1.6rem 1.6rem 0.4rem; text-align: center; color: #2a2622; background: rgba(239,232,218,.94); box-shadow: 0 0 0 1px rgba(33,30,26,.14); opacity: 0; pointer-events: none; }
        .tk-made { position: absolute; left: 16px; bottom: 30px; margin: 0; max-width: min(560px, calc(100% - 200px)); font: 300 11px/1.45 'Jost', sans-serif; color: rgba(33,30,26,.62); }
        .tk-clock { position: absolute; left: 16px; bottom: 10px; margin: 0; font: 400 11px/1.4 'Geist Mono', monospace; letter-spacing: .04em; color: rgba(33,30,26,.6); }
        .tk-simple { position: absolute; right: 16px; bottom: 12px; font: 400 11px/1.4 'Geist Mono', monospace; letter-spacing: .04em; color: rgba(33,30,26,.6); text-decoration: none; }
        .tk-simple-slow { display: none; }
        .tk-simple.slow { color: ${INK}; background: rgba(239,232,218,.94); padding: 6px 10px; box-shadow: 0 0 0 1px rgba(33,30,26,.3); }
        .tk-simple.slow .tk-simple-slow { display: inline; }
        @media (max-width: 700px) {
          .tk-map { top: auto; bottom: 84px; width: 80px; }
          .tk-hero { top: 88px; bottom: 112px; left: 16px; right: 16px; width: auto; transform: none; display: flex; flex-direction: column; }
          .tk-hero-title { font-size: 2.6rem; margin: .3em 0 0; }
          .tk-hero-sub { margin-top: auto !important; font-size: 13px; }
          .tk-hero-coord { margin-top: .6em !important; }
          .tk-hero-hint { margin-top: .9em !important; }
          .tk-made { bottom: 30px; max-width: calc(100% - 32px); font-size: 10px; }
          .tk-clock { display: none; }
          .tk-form { top: auto; right: 16px; bottom: 36px; transform: none; padding: 1.1rem 1.1rem 0.2rem; }
        }
      `}</style>
    </section>
  )
}
