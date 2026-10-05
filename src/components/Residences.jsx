import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import DistortImage from './DistortImage'
import SplitText from './SplitText'

const units = [
  {
    type: '4-Storey Zero-Lot Bungalow',
    name: 'Courtyard Homes',
    units: '32 Units',
    beds: '6', baths: '7', parking: '5+1',
    size: '6,649 – 9,053 sqft',
    price: 'From RM 8.1M',
    img: `${import.meta.env.BASE_URL}images/courtyard-homes.webp`
  },
  {
    type: '1.5 & 2-Storey Condominium',
    name: 'Courtyard Villas',
    units: '207 Units',
    beds: '4–6', baths: '5–6', parking: '4',
    size: '2,734 – 5,176 sqft',
    price: 'From RM 3.3M',
    img: `${import.meta.env.BASE_URL}images/courtyard-villas.webp`
  }
]

export default function Residences() {
  const sectionRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          gsap.fromTo('.res-header',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
          )
          gsap.fromTo('.res-card',
            { opacity: 0, y: 60, clipPath: 'inset(0 0 100% 0)' },
            { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1.1, stagger: 0.15, ease: 'power4.out', delay: 0.2 }
          )
          observer.disconnect()
        }
      })
    }, { threshold: 0.15 })
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="residences" className="res-section" style={{
      background: '#161512',
      padding: '8rem 4rem'
    }}>
      <div className="res-header" style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '3.5rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid rgba(200,168,107,0.15)',
        opacity: 0, transform: 'translateY(30px)'
      }}>
        <div>
          <p style={{
            fontSize: '0.58rem', letterSpacing: '0.28em',
            textTransform: 'uppercase', color: '#c8a86b',
            marginBottom: '0.8rem'
          }}>/ Residences /</p>
          
          <SplitText
        
        style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2.4rem,4vw,3.5rem)',
            fontWeight: 300, lineHeight: 1.1
        }}
            delay={0.1}
        >
            {`Choose Your\nPrivate Realm`}
        </SplitText>
        
        </div>
        <p className="res-intro" style={{
          fontSize: '0.72rem', color: 'rgba(240,232,213,0.5)',
          maxWidth: 260, textAlign: 'right', lineHeight: 1.9
        }}>Two typologies, crafted for lives <br />lived with intention and grace.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
        gap: '2px'
      }}>
        {units.map((u, i) => (
          <div key={i} className="res-card" style={{
            background: '#1e1d1a',
            overflow: 'hidden',
            cursor: 'none',
            opacity: 0
          }}>
            <div style={{ height: 360, overflow: 'hidden', position: 'relative' }}>
              <DistortImage src={u.img} />
              <div style={{
                position: 'absolute', top: '1.2rem', right: '1.2rem',
                zIndex: 10,
                fontSize: '0.58rem', letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#080806', background: '#c8a86b',
                padding: '0.35rem 0.8rem'
              }}>{u.units}</div>
              <div style={{
                position: 'absolute', left: '1.2rem', bottom: '1rem',
                zIndex: 10, pointerEvents: 'none',
                fontSize: '0.55rem', letterSpacing: '0.12em',
                color: 'rgba(240,232,213,0.7)'
              }}>Artist&rsquo;s impression</div>
            </div>

            <div style={{
              padding: '2rem',
              borderTop: '1px solid rgba(200,168,107,0.15)'
            }}>
              <p style={{
                fontSize: '0.58rem', letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#c8a86b',
                marginBottom: '0.6rem'
              }}>{u.type}</p>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '2rem', fontWeight: 300,
                lineHeight: 1.15, marginBottom: '1rem'
              }}>{u.name}</h3>
              <div style={{
                display: 'flex', gap: '0.7rem',
                fontSize: '0.7rem', color: 'rgba(240,232,213,0.5)',
                marginBottom: '1.2rem'
              }}>
                <span>{u.beds} Beds</span>
                <span>·</span>
                <span>{u.baths} Baths</span>
                <span>·</span>
                <span>{u.parking} Parking</span>
              </div>
              <div style={{
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.68rem',
                  color: 'rgba(240,232,213,0.35)',
                  letterSpacing: '0.06em'
                }}>{u.size}</span>
                <span style={{
                  fontSize: '0.72rem',
                  color: '#c8a86b',
                  letterSpacing: '0.06em'
                }}>{u.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 760px) {
          .res-section { padding: 6rem 1.5rem !important; }
          .res-header { flex-direction: column; align-items: flex-start !important; gap: 1.2rem; }
          .res-intro { text-align: left !important; }
          .res-intro br { display: none; }
        }
      `}</style>
    </section>
  )
}