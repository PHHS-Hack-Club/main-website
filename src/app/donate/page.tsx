export default function DonatePage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
      <div className="stack" style={{ maxWidth: 640, marginInline: 'auto' }}>
        <div>
          <p style={{ color: 'var(--yellow)', fontWeight: 800, letterSpacing: '0.08em', margin: 0 }}>SUPPORT THE CLUB</p>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em' }}>Help us keep shipping.</h1>
        </div>

        <p style={{ color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
          Donations help cover club materials, event food, stickers, hardware experiments, and student project costs.
          All funds are managed transparently through Hack Club HCB.
        </p>

        <div className="card" style={{ borderColor: 'rgba(241, 196, 15, 0.25)', background: 'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(241, 196, 15, 0.04) 0%, var(--surface) 60%)' }}>
          <div className="stack">
            <div>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1rem' }}>One-time or recurring donation</p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                Every dollar goes directly toward club operations — 3D printing filament, domain costs, hardware, and events. No overhead, no middlemen.
              </p>
            </div>
            <a
              href="https://hcb.hackclub.com/donations/start/phhs-hack-club"
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ background: 'var(--yellow)', borderColor: 'var(--yellow)', color: '#1a1400', fontWeight: 800, width: 'fit-content' }}
            >
              Donate via HCB ↗
            </a>
            <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              hcb.hackclub.com · opens in new tab
            </p>
          </div>
        </div>

        <div className="card" style={{ borderColor: 'var(--border)' }}>
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// WHERE IT GOES'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: '3D Printing', desc: 'Filament, print time, and materials for student projects' },
              { label: 'Hardware', desc: 'Microcontrollers, sensors, and prototyping components' },
              { label: 'Domains & Hosting', desc: 'Custom domains for member projects' },
              { label: 'Events', desc: 'Food and supplies for demo days and hackathons' },
            ].map((item) => (
              <div key={item.label}>
                <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.88rem' }}>{item.label}</p>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
