import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const navItems = [
  { label: 'Residences', href: '#residences' },
  { label: 'Masterplan', href: '#masterplan' },
  { label: 'Facilities', href: '#facilities' },
  { label: 'Location', href: '#location' },
]

export default function Navbar() {
  const navRef = useRef()
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

  return (
    <nav ref={navRef} className="site-nav" style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 100,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '2.5rem 4rem',
      transition: 'padding 0.5s, background 0.5s, backdrop-filter 0.5s'
    }}>
      <a href="#" style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '0.95rem', letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#f0e8d5', textDecoration: 'none',
        lineHeight: 1.4
      }}>
        Unofficial<br />Project
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
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

        <a href="#enquire" className="magnetic" style={{
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

      <style>{`
        @media (max-width: 760px) {
          .site-nav { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          .site-nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  )
}