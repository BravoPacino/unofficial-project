import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { lenisRef } from '../lib/lenis'

const navItems = [
  { label: 'Residences', href: '#residences' },
  { label: 'Masterplan', href: '#masterplan' },
  { label: 'Facilities', href: '#facilities' },
  { label: 'Location', href: '#location' },
]

export default function Navbar() {
  const navRef = useRef()
  const menuRef = useRef()
  const toggleRef = useRef()
  const [active, setActive] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (navRef.current) {
        navRef.current.style.background = window.scrollY > 80
          ? 'rgba(8,8,6,0.92)'
          : 'transparent'
        navRef.current.style.backdropFilter = window.scrollY > 80
          ? 'blur(16px)'
          : 'none'
        navRef.current.style.padding = window.scrollY > 80
          ? '1.2rem 4rem'
          : '2.5rem 4rem'
      }

      const sections = ['residences', 'masterplan' ,'facilities', 'location', 'enquire']
      const triggerPoint = window.innerHeight * 0.3;

      sections.forEach(id => {
        const el = document.getElementById(id)
        if (!el) return
        const rect = el.getBoundingClientRect()

        if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
          setActive(id)
        }
      })

      if (window.scrollY < 100) setActive('')
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
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

  return (
    <>
      <nav ref={navRef} className="site-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2.5rem 4rem',
        transition: 'padding 0.5s, background 0.5s, backdrop-filter 0.5s'
      }}>
        <a href="#" onClick={close} style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '0.95rem', letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#f0e8d5', textDecoration: 'none',
          lineHeight: 1.4
        }}>
          Unofficial<br />Project
        </a>

        <div className="site-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <ul className="site-nav-links" style={{
            display: 'flex', gap: '2.5rem',
            listStyle: 'none', margin: 0, padding: 0
          }}>
            {navItems.map(item => {
              const id = item.href.replace('#', '')
              const isActive = active === id
              return (
                <li key={item.label}>
                  <a href={item.href} style={{
                    fontSize: '0.62rem', letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: isActive ? '#c8a86b' : 'rgba(240,232,213,0.6)',
                    textDecoration: 'none',
                    transition: 'color 0.3s',
                    position: 'relative',
                    paddingBottom: '4px'
                  }}
                    onMouseEnter={e => {
                      if (!isActive) e.target.style.color = '#f0e8d5'
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.target.style.color = 'rgba(240,232,213,0.6)'
                    }}
                  >
                    {item.label}
                    <span style={{
                      position: 'absolute',
                      bottom: 0, left: 0,
                      width: isActive ? '100%' : '0%',
                      height: '1px',
                      background: '#c8a86b',
                      transition: 'width 0.4s ease'
                    }} />
                  </a>
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
            style={{
              display: 'none',
              background: 'none',
              border: '1px solid rgba(240,232,213,0.3)',
              color: '#f0e8d5',
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.6rem', letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '0.7rem 1.1rem'
            }}
          >{menuOpen ? 'Close' : 'Menu'}</button>

          <a href="#enquire" className="magnetic site-nav-cta" onClick={close} style={{
            fontSize: '0.6rem', letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#080806', background: '#c8a86b',
            padding: '0.7rem 1.8rem',
            textDecoration: 'none',
            transition: 'background 0.3s'
          }}
            onMouseEnter={e => e.target.style.background = '#e3cb96'}
            onMouseLeave={e => e.target.style.background = '#c8a86b'}
          >Register</a>
        </div>
      </nav>

      <div
        id="site-menu"
        ref={menuRef}
        className="site-menu"
        inert={!menuOpen}
        style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: '#080806',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '7.5rem 1.5rem 2.5rem',
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? 'visible' : 'hidden',
          transition: menuOpen ? 'opacity 0.35s ease' : 'opacity 0.35s ease, visibility 0s linear 0.35s'
        }}
      >
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {navItems.map((item, i) => {
            const isActive = active === item.href.slice(1)
            return (
              <li key={item.label} className="site-menu-item">
                <a href={item.href} onClick={close} style={{
                  display: 'flex', alignItems: 'baseline', gap: '1.2rem',
                  padding: '1.1rem 0',
                  borderBottom: '1px solid rgba(200,168,107,0.15)',
                  textDecoration: 'none'
                }}>
                  <span style={{
                    fontSize: '0.58rem', letterSpacing: '0.2em',
                    color: '#c8a86b'
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '2.2rem', fontWeight: 300, lineHeight: 1.1,
                    color: isActive ? '#c8a86b' : '#f0e8d5'
                  }}>{item.label}</span>
                </a>
              </li>
            )
          })}
        </ul>

        <p className="site-menu-item" style={{
          fontSize: '0.58rem', letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(240,232,213,0.4)'
        }}>Unofficial concept · George Town, Penang</p>
      </div>

      <style>{`
        .site-menu { display: none !important; }
        @media (max-width: 760px) {
          .site-nav { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          .site-nav-links { display: none !important; }
          .site-nav-right { gap: 0.8rem !important; }
          .site-nav-toggle { display: inline-block !important; }
          .site-nav-cta { padding: 0.7rem 1.1rem !important; }
          .site-menu { display: flex !important; }
        }
      `}</style>
    </>
  )
}
