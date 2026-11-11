import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { lenisRef } from '../lib/lenis'
import { STOPS } from '../ink/stops'

// in the order the page reaches them: the one take walks the facilities, then the homes, and the location and the
// masterplan follow it; the sectioned page has its own order
const LOCATION = { label: 'Location', href: '#location' }, MASTERPLAN = { label: 'Masterplan', href: '#masterplan' }
const FACILITIES = { label: 'Facilities', href: '#facilities', group: 'facilities' }, RESIDENCES = { label: 'Residences', href: '#residences', group: 'residences' }
const TAKE_ORDER = [FACILITIES, RESIDENCES, LOCATION, MASTERPLAN], SECTIONS_ORDER = [LOCATION, MASTERPLAN, RESIDENCES, FACILITIES]
const ORDER = ['location', 'masterplan', 'facilities', 'residences', 'enquire']
const topOf = (el) => el.getBoundingClientRect().top + window.scrollY

export default function Navbar() {
  const navRef = useRef()
  const menuRef = useRef()
  const toggleRef = useRef()
  const [active, setActive] = useState('')
  const [stop, setStop] = useState('')
  const [paper, setPaper] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hasStops, setHasStops] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const nav = navRef.current
      setScrolled(window.scrollY > 80)

      // the part of the page lit in the nav: the last one whose start has passed 30% down the screen. By position, so the
      // one take's markers (1 px tall, at its stops) count the same as whole sections.
      const line = window.scrollY + window.innerHeight * 0.3
      let id = '', best = -Infinity
      for (const k of ORDER) {
        const el = document.getElementById(k)
        if (!el) continue
        const t = topOf(el)
        if (t <= line && t > best) { best = t; id = k }
      }
      setActive(window.scrollY < 100 ? '' : id)

      // inside the one take: which stop the camera is at, and the nav turns to the drawing's paper and ink
      const take = document.querySelector('.take')
      setHasStops(!!document.getElementById('stop-gate'))
      let at = '', bestS = -Infinity
      for (const s of STOPS) {
        const el = document.getElementById(`stop-${s.key}`)
        if (!el) continue
        const t = topOf(el)
        if (t <= line && t > bestS) { bestS = t; at = s.key }
      }
      setStop(at)
      if (take) {
        const r = take.getBoundingClientRect(), h = nav ? nav.offsetHeight / 2 : 40
        setPaper(r.top <= h && r.bottom > h)
      } else setPaper(false)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const late = setTimeout(onScroll, 1500)
    // colours change without a transition until the first frame is up: the bar starts as what it lies on, with no flash
    const on = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); clearTimeout(late); cancelAnimationFrame(on) }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const root = document.documentElement
    root.style.overflow = 'hidden'
    lenisRef.current?.stop()

    const items = menuRef.current.querySelectorAll('.site-menu-item')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) gsap.set(items, { opacity: 1, y: 0 })
    else gsap.fromTo(items, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 })
    menuRef.current.querySelector('a')?.focus({ preventScroll: true })

    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      toggleRef.current?.focus()
    }
    const wide = window.matchMedia('(min-width: 761px)')
    const onWide = (e) => { if (e.matches) setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    wide.addEventListener('change', onWide)
    return () => {
      document.removeEventListener('keydown', onKey)
      wide.removeEventListener('change', onWide)
      root.style.overflow = ''
      lenisRef.current?.start()
    }
  }, [menuOpen])

  const close = () => setMenuOpen(false)
  const navItems = hasStops ? TAKE_ORDER : SECTIONS_ORDER
  // closing a dropdown after a click: focus leaves it, so :focus-within lets it go
  const leave = (e) => e.currentTarget.blur()
  const subOf = (group) => (hasStops && group ? STOPS.filter((s) => s.group === group) : [])

  return (
    <>
      <nav ref={navRef} className={`site-nav${paper ? ' paper' : ''}${scrolled ? ' scrolled' : ''}${ready ? '' : ' still'}`}>
        <a href="#" onClick={close} className="site-nav-logo">Unofficial<br />Project</a>

        <div className="site-nav-right">
          <ul className="site-nav-links">
            {navItems.map(item => {
              const id = item.href.slice(1)
              const sub = subOf(item.group)
              return (
                <li key={item.label} className={sub.length ? 'has-sub' : undefined}>
                  <a href={item.href} className={`site-nav-link${active === id ? ' on' : ''}`} aria-current={active === id ? 'location' : undefined} onClick={leave}>
                    {item.label}{sub.length ? <span className="site-nav-caret" aria-hidden="true">▾</span> : null}
                    <span className="site-nav-bar" />
                  </a>
                  {sub.length > 0 && (
                    <ul className="site-nav-sub">
                      {sub.map((s) => (
                        <li key={s.key}>
                          <a href={`#stop-${s.key}`} className={stop === s.key ? 'on' : undefined} aria-current={stop === s.key ? 'location' : undefined} onClick={leave}>{s.label}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>

          <button
            ref={toggleRef}
            type="button"
            className="site-nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen(open => !open)}
          >{menuOpen ? 'Close' : 'Menu'}</button>

          <a href="#enquire" className="magnetic site-nav-cta" onClick={close}>Register</a>
        </div>
      </nav>

      <div
        id="site-menu"
        ref={menuRef}
        className={`site-menu${paper ? ' paper' : ''}`}
        inert={!menuOpen}
        style={{
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? 'visible' : 'hidden',
          transition: menuOpen ? 'opacity 0.35s ease' : 'opacity 0.35s ease, visibility 0s linear 0.35s'
        }}
      >
        <ul className="site-menu-list">
          {navItems.map((item, i) => {
            const isActive = active === item.href.slice(1)
            const sub = subOf(item.group)
            return (
              <li key={item.label} className="site-menu-item">
                <a href={item.href} onClick={close} className={`site-menu-main${isActive ? ' on' : ''}`}>
                  <span className="site-menu-no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="site-menu-label">{item.label}</span>
                </a>
                {sub.length > 0 && (
                  <ul className="site-menu-sub">
                    {sub.map((s) => <li key={s.key}><a href={`#stop-${s.key}`} onClick={close} className={stop === s.key ? 'on' : undefined}>{s.label}</a></li>)}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>

        <p className="site-menu-item site-menu-foot">Unofficial concept · George Town, Penang</p>
      </div>

      <style>{`
        .site-nav {
          --nav-fg: #f0e8d5; --nav-dim: rgba(240,232,213,0.6); --nav-on: #c8a86b; --nav-bg: rgba(8,8,6,0.92);
          --nav-cta-bg: #c8a86b; --nav-cta-hover: #e3cb96; --nav-cta-fg: #080806; --nav-line: rgba(240,232,213,0.3); --nav-sub-bg: rgba(8,8,6,0.97);
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 2.5rem 4rem;
          transition: padding 0.5s, background 0.5s, backdrop-filter 0.5s, color 0.5s;
        }
        .site-nav.still, .site-nav.still * { transition: none !important; }
        .site-nav.scrolled { background: var(--nav-bg); backdrop-filter: blur(16px); padding: 1.2rem 4rem; }
        /* over the one take's drawing: its paper and ink, a hairline under the bar instead of a dark band */
        .site-nav.paper {
          --nav-fg: #211e1a; --nav-dim: rgba(33,30,26,0.62); --nav-on: #8a6526; --nav-bg: rgba(239,232,218,0.9);
          --nav-cta-bg: #211e1a; --nav-cta-hover: #3d3830; --nav-cta-fg: #efe8da; --nav-line: rgba(33,30,26,0.35); --nav-sub-bg: rgba(239,232,218,0.98);
        }
        .site-nav.paper.scrolled { box-shadow: 0 1px 0 rgba(33,30,26,0.14); }
        .site-nav-logo {
          font-family: 'Cormorant Garamond', serif; font-size: 0.95rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--nav-fg); text-decoration: none; line-height: 1.4; transition: color 0.5s;
        }
        .site-nav-right { display: flex; align-items: center; gap: 2.5rem; }
        .site-nav-links { display: flex; gap: 2.5rem; list-style: none; margin: 0; padding: 0; }
        .site-nav-links > li { position: relative; }
        .site-nav-link {
          font-size: 0.62rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--nav-dim); text-decoration: none; transition: color 0.3s; position: relative; padding-bottom: 4px;
          display: inline-flex; align-items: center; gap: 0.4em;
        }
        .site-nav-link:hover, .site-nav-link:focus-visible { color: var(--nav-fg); }
        .site-nav-link.on { color: var(--nav-on); }
        .site-nav-caret { font-size: 0.7em; opacity: 0.7; transition: transform 0.3s; }
        .site-nav-bar { position: absolute; bottom: 0; left: 0; width: 0; height: 1px; background: var(--nav-on); transition: width 0.4s ease; }
        .site-nav-link.on .site-nav-bar { width: 100%; }

        /* the stops of the one take under Facilities and Residences: open on hover or keyboard focus */
        .site-nav-sub {
          position: absolute; top: 100%; left: -1.1rem; margin: 0; padding: 0.9rem 0 0.7rem; list-style: none;
          min-width: 15rem; background: var(--nav-sub-bg); backdrop-filter: blur(16px);
          border: 1px solid var(--nav-line); border-top: none;
          opacity: 0; visibility: hidden; transform: translateY(-4px);
          transition: opacity 0.25s, transform 0.25s, visibility 0s linear 0.25s;
        }
        .site-nav-sub::before { content: ''; position: absolute; left: 0; right: 0; bottom: 100%; height: 1.4rem; }
        .has-sub:hover > .site-nav-sub, .has-sub:focus-within > .site-nav-sub {
          opacity: 1; visibility: visible; transform: none; transition: opacity 0.25s, transform 0.25s;
        }
        .has-sub:hover .site-nav-caret, .has-sub:focus-within .site-nav-caret { transform: rotate(180deg); }
        .site-nav-sub a {
          display: block; padding: 0.5rem 1.1rem; font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--nav-dim); text-decoration: none; white-space: nowrap; transition: color 0.2s;
          border-left: 1px solid transparent;
        }
        .site-nav-sub a:hover, .site-nav-sub a:focus-visible { color: var(--nav-fg); }
        .site-nav-sub a.on { color: var(--nav-on); border-left-color: var(--nav-on); }

        .site-nav-toggle {
          display: none; background: none; border: 1px solid var(--nav-line); color: var(--nav-fg);
          font-family: Jost, sans-serif; font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; padding: 0.7rem 1.1rem;
        }
        .site-nav-cta {
          font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--nav-cta-fg); background: var(--nav-cta-bg); padding: 0.7rem 1.8rem; text-decoration: none;
          transition: background 0.3s, color 0.3s;
        }
        .site-nav-cta:hover { background: var(--nav-cta-hover); }

        .site-menu {
          --menu-bg: #080806; --menu-fg: #f0e8d5; --menu-on: #c8a86b; --menu-dim: rgba(240,232,213,0.5); --menu-line: rgba(200,168,107,0.15);
          position: fixed; inset: 0; z-index: 99; background: var(--menu-bg);
          display: none !important; flex-direction: column; justify-content: space-between; gap: 2rem;
          padding: 7.5rem 1.5rem 2.5rem; overflow-y: auto; overscroll-behavior: contain;
        }
        .site-menu.paper { --menu-bg: #efe8da; --menu-fg: #211e1a; --menu-on: #8a6526; --menu-dim: rgba(33,30,26,0.55); --menu-line: rgba(33,30,26,0.15); }
        .site-menu-list { list-style: none; margin: 0; padding: 0; }
        .site-menu-main { display: flex; align-items: baseline; gap: 1.2rem; padding: 1.1rem 0; border-bottom: 1px solid var(--menu-line); text-decoration: none; }
        .site-menu-no { font-size: 0.58rem; letter-spacing: 0.2em; color: var(--menu-on); }
        .site-menu-label { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 300; line-height: 1.1; color: var(--menu-fg); }
        .site-menu-main.on .site-menu-label { color: var(--menu-on); }
        .site-menu-sub { list-style: none; margin: 0; padding: 0.7rem 0 0.9rem 2.1rem; display: flex; flex-wrap: wrap; gap: 0.35rem 1.1rem; border-bottom: 1px solid var(--menu-line); }
        .site-menu-sub a { font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--menu-dim); text-decoration: none; line-height: 2; }
        .site-menu-sub a.on { color: var(--menu-on); }
        .site-menu-foot { font-size: 0.58rem; letter-spacing: 0.28em; text-transform: uppercase; color: var(--menu-dim); margin: 0; }

        @media (max-width: 760px) {
          .site-nav, .site-nav.scrolled { padding-left: 1.5rem; padding-right: 1.5rem; }
          .site-nav-links { display: none; }
          .site-nav-right { gap: 0.8rem; }
          .site-nav-toggle { display: inline-block; }
          .site-nav-cta { padding: 0.7rem 1.1rem; }
          .site-menu { display: flex !important; }
        }
      `}</style>
    </>
  )
}
