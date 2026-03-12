import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
      <div className="card stack" style={{ maxWidth: 720 }}>
        <p style={{ color: 'var(--red)', fontWeight: 800, letterSpacing: '0.08em', margin: 0 }}>404</p>
        <h1 style={{ marginBottom: '0.5rem' }}>Tape ran out.</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          The page you tried to open does not exist or got moved somewhere else in the club archive.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-primary">
            Back home
          </Link>
          <Link href="/gallery" className="btn-outline">
            Open gallery
          </Link>
        </div>
      </div>
    </div>
  )
}
