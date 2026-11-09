import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import SplitText from './SplitText'

const units = [
  {
    type: '4-Storey Zero-Lot Bungalow',
    name: 'Courtyard Homes',
    units: '32 Units',
    beds: '6', baths: '7', parking: '5+1',
    size: '6,649 – 9,053 sqft',
    price: 'From RM 8.1M',
    img: `${import.meta.env.BASE_URL}drawings/homes-ink.webp`
  },
  {
    type: '1.5 & 2-Storey Condominium',
    name: 'Courtyard Villas',
    units: '207 Units',
    beds: '4–6', baths: '5–6', parking: '4',
    size: '2,734 – 5,176 sqft',
    price: 'From RM 3.3M',
    img: `${import.meta.env.BASE_URL}drawings/villas-ink.webp`
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
      background: '#efe8da', color: '#2a2622',
      padding: '8rem 4rem'
    }}>
      <div className="res-header" style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '3.5rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid rgba(42,38,34,0.16)',
        opacity: 0, transform: 'translateY(30px)'
      }}>
        <div>
          <p style={{
            fontSize: '0.58rem', letterSpacing: '0.28em',
            textTransform: 'uppercase', color: '#8a6a33',
            marginBottom: '0.8rem'
          }}>04 — Residences</p>
          
          <SplitText
        
        style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2.4rem,4vw,3.5rem)',
            fontWeight: 300, lineHeight: 1.1, color: '#2a2622'
        }}
            delay={0.1}
        >
            {`Two ways\nto live here`}
        </SplitText>
        
        </div>
        <p className="res-intro" style={{
          fontSize: '0.72rem', color: 'rgba(42,38,34,0.6)',
          maxWidth: 280, textAlign: 'right', lineHeight: 1.9
        }}>32 zero-lot bungalows and 207 <br />condominium villas, 239 homes in all.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
        gap: '2px'
      }}>
        {units.map((u, i) => (
          <div key={i} className="res-card" style={{
            background: '#f6f1e6',
            border: '1px solid rgba(42,38,34,0.14)',
            overflow: 'hidden',
            opacity: 0
          }}>
            <div className="res-img" style={{ aspectRatio: '2 / 1', overflow: 'hidden', position: 'relative' }}>
              <img src={u.img} alt={`${u.name}, line drawing`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 1.2s cubic-bezier(.2,.7,.2,1)' }} />
              <div style={{
                position: 'absolute', top: '1.2rem', right: '1.2rem',
                zIndex: 10,
                fontSize: '0.58rem', letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#efe8da', background: '#2a2622',
                padding: '0.35rem 0.8rem'
              }}>{u.units}</div>
              <div style={{
                position: 'absolute', left: '1.2rem', bottom: '1rem',
                zIndex: 10, pointerEvents: 'none',
                fontSize: '0.55rem', letterSpacing: '0.12em',
                color: 'rgba(42,38,34,0.55)'
              }}>Line study · not to scale</div>
            </div>

            <div style={{
              padding: '2rem',
              borderTop: '1px solid rgba(42,38,34,0.14)'
            }}>
              <p style={{
                fontSize: '0.58rem', letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#8a6a33',
                marginBottom: '0.6rem'
              }}>{u.type}</p>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '2rem', fontWeight: 300,
                lineHeight: 1.15, marginBottom: '1rem'
              }}>{u.name}</h3>
              <div style={{
                display: 'flex', gap: '0.7rem',
                fontSize: '0.7rem', color: 'rgba(42,38,34,0.6)',
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
                borderTop: '1px solid rgba(42,38,34,0.1)',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.68rem',
                  color: 'rgba(42,38,34,0.5)',
                  letterSpacing: '0.06em'
                }}>{u.size}</span>
                <span style={{
                  fontSize: '0.72rem',
                  color: '#8a6a33',
                  letterSpacing: '0.06em'
                }}>{u.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .res-card:hover .res-img img { transform: scale(1.04); }
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