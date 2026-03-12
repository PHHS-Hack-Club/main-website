import Link from 'next/link'

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: 'var(--space-4) var(--space-3)',
        marginTop: 'var(--space-6)',
        background: 'linear-gradient(to bottom, transparent, rgba(14, 12, 20, 0.5))',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
        }}
      >
        <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          &copy; {new Date().getFullYear()} PHHS Hack Club
        </p>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link href="https://hackclub.com" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.02em' }}>
            Hack Club
          </Link>
          <Link href="/contact" style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.02em' }}>
            Contact
          </Link>
          <Link href="/donate" style={{ color: 'var(--orange)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.02em' }}>
            Donate
          </Link>
        </div>
      </div>
    </footer>
  )
}
