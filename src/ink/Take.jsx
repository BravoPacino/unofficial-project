import { useEffect, useMemo, useRef, useState } from 'react'
import { makeRenderer, makeStage } from './stage'
import { adaptKit } from './adapter'
import { clockOf, dayOf, sunWorld } from './light'
import { estate } from './estate'
import { greenWall, water, deck, cabanas, gym, ownDesigns, edges, facades } from './valley'
import { makePath } from './path'
import { KEYS, NOTES } from './take-route'
import { U } from './site'
import plan from '../data/sitePlan.js'

// The one take on the masterplan (docs/world-plan.md): one camera through the estate as the plan lays it out. The estate
// stands in mass (estate.js); where the camera passes, the valley is drawn in full (valley.js), built in pieces as the
// camera comes near and freed behind it. The sun is George Town's now, from its real bearing (the plan has a north).
// A small copy of the plan in the corner shows where the camera is.
const INK = '#211e1a', PAPER = '#efe8da', DISC = '#dba84a'
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const PATH = makePath(KEYS), TOTAL = PATH.TOTAL

// the valley in three pieces along its length (world z), each with what stands in it
const PIECES = [
  { name: 'vN', z0: -112, z1: -60, build: (k, eye) => { greenWall(k); water(k, -112, -60); deck(k, eye); edges(k, -112, -60); facades(k, -112, -60) } },
  { name: 'vM', z0: -60, z1: -6, build: (k, eye) => { water(k, -60, -6); cabanas(k); gym(k, eye); edges(k, -60, -6); facades(k, -60, -6) } },
  { name: 'vS', z0: -6, z1: 95, build: (k) => { water(k, -6, 95); ownDesigns(k); edges(k, -6, 95); facades(k, -6, 95) } },
]

export default function Take() {
  const sectionRef = useRef(), boxRef = useRef(), canvasRef = useRef(), notesRef = useRef(), discRef = useRef(), clockRef = useRef(), camRef = useRef()
  const [mapOpen, setMapOpen] = useState(true)
  // the route on the little map: the camera's eye, sampled along the take
  const route = useMemo(() => Array.from({ length: 121 }, (_, i) => U(...(([x, , z]) => [x, z])(PATH.cameraAt((i / 120) * TOTAL, 16, 9).look.eye))), [])

  useEffect(() => {
    const canvas = canvasRef.current, box = boxRef.current, section = sectionRef.current, notesEl = notesRef.current
    let renderer
    try { renderer = makeRenderer(canvas) } catch { return undefined }
    renderer.shadowMap.autoUpdate = false
    const now = Date.now(), sun = sunWorld(now), day = dayOf(now)
    clockRef.current.textContent = `George Town · ${clockOf(now)} · ` + (sun.up ? 'the light here is the sun there now, from where it really stands'
      : now < day.noon ? 'before sunrise there: drawn in first light' : 'after dark there: drawn in the day’s last light')

    const stage = makeStage(null, { view: PATH.cameraAt(0, 16, 9), ink: INK, paper: PAPER, renderer })
    const eye0 = KEYS[0].eye
    // the estate in mass, always there (the valley's two rows are drawn by the valley pieces where it counts)
    stage.chunk('estate', [0, 0, 0], 0, (kit) => estate(kit, { trim: 12.4 }))
    const want = new Set(), queue = []
    let alive = true, near = false, busy = false
    const pump = () => {
      if (busy || !alive) return
      const name = queue.shift(); if (!name) return
      busy = true
      try {
        const piece = PIECES.find((p) => p.name === name)
        if (want.has(name) && !stage.has(name)) { stage.chunk(name, [0, 0, 0], 0, (kit) => piece.build(adaptKit(kit, null, { ghosts: false }), eye0)); dirty = true; kick() }
      } finally { busy = false }
      if (queue.length) setTimeout(pump, 0)
    }
    const need = (eye) => {
      want.clear()
      for (const p of PIECES) if (eye[2] > p.z0 - 70 && eye[2] < p.z1 + 70) want.add(p.name)
      for (const n of want) if (!stage.has(n) && !queue.includes(n)) queue.push(n)
      for (const p of PIECES) if (!want.has(p.name) && stage.has(p.name)) stage.drop(p.name)
      setTimeout(pump, 0)
    }

    const notes = NOTES.map((n) => {
      const el = document.createElement('div'); el.className = 'tk-note'
      el.innerHTML = `<svg class="tk-lead" aria-hidden="true"><line/><circle r="2.6"/></svg><div class="tk-label"><b></b><span></span></div>`
      el.querySelector('b').textContent = n.title + (n.own ? ' ○' : '')
      el.querySelector('span').textContent = n.text
      if (!n.text) el.querySelector('span').remove()
      notesEl.append(el)
      return { n, el, line: el.querySelector('line'), dot: el.querySelector('circle'), label: el.querySelector('.tk-label') }
    })

    let W = 0, H = 0, dpr = 1, full = false, cur = -1, wantS = 0, raf = 0, idle = 0, lastT = 0, dirty = true, sized = ''
    const measure = () => {
      W = box.clientWidth; H = box.clientHeight
      const top = -section.getBoundingClientRect().top, run = section.offsetHeight - H
      wantS = clamp01(top / (run || 1)) * TOTAL
    }
    const draw = (s) => {
      const v = PATH.cameraAt(s, W, H)
      need(v.look.eye)
      const key = `${W}x${H}@${dpr}`
      if (sized !== key) { stage.resize(W, H, v, dpr); sized = key } else stage.frame(v, W, H)
      stage.render([0, 0, 0.8], { world: sun.dir })
      for (const x of notes) place(x, s)
      sunDisc(v)
      // the little map: where the camera is and which way it looks
      const [ex, , ez] = v.look.eye, [ax, , az] = v.look.at, [mx, my] = U(ex, ez), hd = Math.atan2(az - ez, ax - ex) * 180 / Math.PI
      camRef.current?.setAttribute('transform', `translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${hd.toFixed(1)})`)
    }
    const place = ({ n, el, line, dot, label }, s) => {
      const vis = clamp01((s - n.t0) / 0.15) * clamp01((n.t1 - s) / 0.15), q = stage.project(...n.p)
      if (!q.front || vis <= 0.001) { el.style.opacity = 0; return }
      const phone = W < 700, { dx, dy } = phone ? n.m || { dx: n.dx * 0.55, dy: n.dy * 0.7 } : n, up = dy < 0
      const lw = label.offsetWidth || 220, lh = label.offsetHeight || 60, nav = phone ? 70 : 92
      const lx = dx < 0 ? Math.max(16 + lw, Math.min(W - 16, q.x + dx)) : Math.max(16, Math.min(W - 16 - lw, q.x + dx))
      const ly = up ? Math.max(nav + lh, Math.min(H - 40, q.y + dy)) : Math.max(nav, Math.min(H - 40 - lh, q.y + dy))
      el.style.opacity = 1
      line.setAttribute('x1', q.x); line.setAttribute('y1', q.y); line.setAttribute('x2', q.x + (lx - q.x) * vis); line.setAttribute('y2', q.y + (ly - q.y) * vis)
      dot.setAttribute('cx', q.x); dot.setAttribute('cy', q.y); dot.style.opacity = Math.min(1, vis * 3)
      label.style.transform = `translate(${lx}px, ${ly}px) translate(${dx < 0 ? '-100%' : '0'}, ${up ? '-100%' : '0'}) translateY(${(1 - clamp01(vis * 1.4 - 0.4)) * 10}px)`
      label.style.opacity = clamp01(vis * 1.6 - 0.6)
    }
    const sunDisc = (v) => {
      const [ex, ey, ez] = v.look.eye, d = sun.dir, q = stage.project(ex + d[0] * 300, ey + d[1] * 300, ez + d[2] * 300)
      const r = 0.05 * Math.max(W, H), el = discRef.current
      el.style.opacity = sun.up && q.front ? 1 : 0
      el.style.transform = `translate(${q.x - r}px, ${q.y - r}px)`; el.style.width = el.style.height = `${2 * r}px`
    }

    const tick = (time) => {
      raf = 0
      if (!near) return
      const dt = Math.min(0.1, (time - (lastT || time)) / 1000); lastT = time
      const moving = Math.abs(wantS - cur) > 0.0005
      if (moving) { cur = cur < 0 ? wantS : lerp(cur, wantS, 1 - Math.exp(-dt * 6)); idle = time }
      if (moving && full) { full = false; dpr = 1 }
      if (!moving && !full && time - idle > 220) { full = true; dpr = Math.min(window.devicePixelRatio || 1, 2); dirty = true }
      if (moving || dirty) { draw(cur); dirty = false }
      if (moving || !full || dirty) raf = requestAnimationFrame(tick)
      else lastT = 0
    }
    const kick = () => { if (!raf && near) raf = requestAnimationFrame(tick) }
    const onScroll = () => { if (!near) return; measure(); kick() }
    const onResize = () => { measure(); sized = ''; dirty = true; kick() }
    const io = new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) { measure(); cur = wantS; dirty = true; kick() } }, { rootMargin: '100% 0px' })
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
      <div ref={boxRef} className="tk-stage">
        <div ref={discRef} className="tk-disc" />
        <canvas ref={canvasRef} className="tk-canvas" role="img" aria-label="A drawing in ink of the estate as its masterplan lays it out, seen from one camera that moves as the page scrolls." />
        <div ref={notesRef} className="tk-notes" />
        <button type="button" className={mapOpen ? 'tk-map' : 'tk-map tk-map-closed'} onClick={() => setMapOpen((o) => !o)} aria-label={mapOpen ? 'Hide the little map' : 'Show the little map'}>
          <svg viewBox="20 20 480 750" aria-hidden="true">
            <path d={mapLines} />
            <polyline className="tk-route" points={route.map((p) => p.join(',')).join(' ')} />
            <g ref={camRef}><path className="tk-cone" d="M0 0 L42 -16 L42 16 Z" /><circle r="7" /></g>
          </svg>
        </button>
        <p className="tk-made">Laid out from the developer’s masterplan. Heights, and which home or bridge each drawing shows, are our reading; ○ marks a facility with no published image, drawn in our own hand.</p>
        <p ref={clockRef} className="tk-clock" />
      </div>
      <style>{`
        .take { position: relative; background: ${PAPER}; }
        .tk-stage { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; background: ${PAPER}; }
        .tk-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
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
        .tk-made { position: absolute; left: 16px; bottom: 30px; margin: 0; max-width: min(560px, calc(100% - 32px)); font: 300 11px/1.45 'Jost', sans-serif; color: rgba(33,30,26,.62); }
        .tk-clock { position: absolute; left: 16px; bottom: 10px; margin: 0; font: 400 11px/1.4 'Geist Mono', monospace; letter-spacing: .04em; color: rgba(33,30,26,.6); }
        @media (max-width: 700px) { .tk-map { top: auto; bottom: 64px; width: 84px; } .tk-made { bottom: 30px; font-size: 10px; } .tk-clock { font-size: 10px; } }
      `}</style>
    </section>
  )
}
