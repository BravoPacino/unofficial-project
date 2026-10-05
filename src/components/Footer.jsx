const muted = { fontSize: '0.7rem', color: 'rgba(240,232,213,0.5)', lineHeight: 2 }
const heading = {
  fontSize: '0.55rem', letterSpacing: '0.25em',
  textTransform: 'uppercase', color: '#c8a86b',
  marginBottom: '1.2rem'
}

export default function Footer() {
  return (
    <>
      <footer className="site-footer" style={{
        background: '#080806',
        padding: '4rem',
        borderTop: '1px solid rgba(200,168,107,0.1)',
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '3rem'
      }}>
        <div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.1rem', fontWeight: 300,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: '0.8rem'
          }}>Unofficial Project</div>
          <p style={{ ...muted, fontSize: '0.62rem', letterSpacing: '0.04em', maxWidth: 360 }}>
            An unofficial concept site: a design study of a real development in George Town.
          </p>
        </div>

        <div>
          <h4 style={heading}>Credits</h4>
          <p style={muted}>Map data: © OpenStreetMap contributors</p>
          <p style={muted}>Light: the sun over George Town, computed live</p>
        </div>
      </footer>

      <div className="site-footer-bar" style={{
        background: '#080806',
        padding: '1.2rem 4rem',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <p style={{
          fontSize: '0.56rem', letterSpacing: '0.08em',
          color: 'rgba(240,232,213,0.3)'
        }}>© 2026 · Unofficial Project · Not the developer&rsquo;s official website</p>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .site-footer { grid-template-columns: 1fr !important; gap: 2rem !important; padding: 3rem 1.5rem !important; }
          .site-footer-bar { padding: 1.2rem 1.5rem !important; }
        }
      `}</style>
    </>
  )
}
