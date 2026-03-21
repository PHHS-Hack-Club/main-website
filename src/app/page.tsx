import Link from 'next/link'
import { getSession } from '@/lib/auth'

const highlights = [
  {
    title: 'Build & Ship',
    body: 'Learn by doing websites, games, 3D-printed objects, and whatever else you want to make. Every finished project gets celebrated.',
  },
  {
    title: 'Real Perks (YSWS)',
    body: 'Ship a qualifying project and Hack Club HQ will mail you hardware grants Raspberry Pis, Sprig consoles, custom domains, and more.',
  },
  {
    title: 'Student-Led, Always',
    body: "No grades, no tests. By students, for students. We're part of a global network of 4,000+ Hack Clubs with a local PHHS crew running it.",
  },
]

const semesterPlan = [
  { month: 'OCT', label: 'Web Dev', desc: 'Build a personal site with HTML, CSS & JS. Leave with a live URL.' },
  { month: 'NOV', label: 'Game Dev', desc: 'Build a Sprig game. Ship it to the gallery and get a physical console.' },
  { month: 'DEC', label: '3D / CAD', desc: 'Design your first 3D-printable object keychains, desk toys, whatever.' },
  { month: 'JAN', label: 'Demo Day', desc: 'Present what you built. Show it off. Ship it into the world.' },
]

const meetingDetails = [
  { k: 'Day', v: 'Every Thursday' },
  { k: 'Time', v: '3:00 - 4:00 PM' },
  { k: 'Location', v: 'Room 255 · Pascack Hills HS' },
  { k: 'Open to', v: 'All PHHS students - any grade, any skill level' },
]

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const pending = params?.pending === 'true'
  const error = typeof params?.error === 'string' ? params.error : ''
  const session = await getSession()

  return (
    <>
      <a href="https://hackclub.com/" style={{ position: 'absolute', top: 0, left: 10, zIndex: 1000 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          style={{ border: 0, width: 'clamp(90px, 16vw, 256px)' }}
          src="https://assets.hackclub.com/flag-orpheus-top.svg"
          alt="Hack Club"
        />
      </a>
      <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-6)' }}>
      {(pending || error) && (
        <section
          className="card"
          style={{
            marginBottom: 'var(--space-3)',
            borderColor: pending ? 'rgba(255, 140, 55, 0.45)' : 'rgba(236, 55, 80, 0.45)',
          }}
        >
          <p style={{ margin: 0, color: pending ? 'var(--orange)' : 'var(--red)', fontWeight: 800, letterSpacing: '0.08em' }}>
            {pending ? 'VERIFICATION PENDING' : 'LOGIN ERROR'}
          </p>
          <p style={{ color: 'var(--smoke)', marginBottom: 0 }}>
            {pending
              ? 'Your Hack Club account was recognized, but you still need admin approval before the portal opens.'
              : `Hack Club sign-in failed (${error}). Check your OAuth configuration and try again.`}
          </p>
        </section>
      )}

      {/* Hero */}
      <section
        className="card hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 'var(--space-4)',
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
          /* warm radial glow behind hero text */
          background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(236, 55, 80, 0.07) 0%, var(--surface) 60%)',
          borderColor: 'rgba(200, 190, 255, 0.12)',
        }}
      >
        <div className="stack animate-up">
          <span
            style={{
              display: 'inline-flex',
              width: 'fit-content',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(236, 55, 80, 0.12)',
              border: '1px solid rgba(236, 55, 80, 0.25)',
              color: 'var(--red)',
              fontWeight: 800,
              letterSpacing: '0.12em',
              fontSize: '0.72rem',
            }}
          >
            BUILD · BREAK · LEARN
          </span>
          <div>
            <h1
              className="glow-red"
              style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', lineHeight: 0.92, margin: 0, letterSpacing: '-0.02em' }}
            >
              PHHS
              <br />
              Hack Club
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '1.05rem', maxWidth: 560, marginTop: '1rem' }}>
              Pascack Hills High School&apos;s chapter of the global Hack Club network. We meet weekly to make websites, games, hardware projects, art, and whatever else members want to bring to life.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            {session ? (
              <Link href="/portal" className="btn-primary">
                Go to Portal →
              </Link>
            ) : (
              <a href="/api/auth/login" className="btn-primary">
                Member Login →
              </a>
            )}
            <Link href="/about" className="btn-outline">
              See What We Do
            </Link>
          </div>
        </div>

        <div
          style={{
            minHeight: 320,
            borderRadius: 'var(--radius)',
            background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.05) 0%, rgba(14, 12, 20, 0.6) 100%)',
            border: '1px solid rgba(200, 190, 255, 0.1)',
            padding: 'var(--space-4)',
            display: 'grid',
            gap: 'var(--space-2)',
          }}
        >
          <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {'// 2026–27 · SEMESTER 1'}
          </p>
          {semesterPlan.map((item, i) => (
            <div
              key={item.month}
              className="surface animate-up"
              style={{ padding: '0.8rem 1rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', animationDelay: `${0.05 * i}s` }}
            >
              <span style={{ color: 'var(--orange)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', minWidth: 32, paddingTop: 3, fontFamily: 'var(--font-mono)' }}>
                {item.month}
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{item.label}</p>
                <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ paddingTop: 'var(--space-5)' }}>
        <p style={{ margin: '0 0 var(--space-3)', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// WHY JOIN'}</p>
        <div className="grid-cards">
          {highlights.map((highlight, i) => (
            <article key={highlight.title} className="card card-interactive animate-up" style={{ animationDelay: `${0.07 * i}s` }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{highlight.title}</h2>
              <p style={{ marginBottom: 0, color: 'var(--muted)', lineHeight: 1.75, fontSize: '0.92rem' }}>{highlight.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ paddingTop: 'var(--space-5)' }}>
        <div className="card info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', borderColor: 'rgba(200, 190, 255, 0.1)' }}>
          <div>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// ABOUT HACK CLUB'}</p>
            <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--muted)', fontSize: '0.95rem' }}>
              Hack Club is a global non-profit network of 4,000+ high school clubs for people who make things with technology. Around here, &ldquo;hack&rdquo; means building, experimenting, sharing, and learning in public.
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// SUPPORT THE CLUB'}</p>
            <p style={{ margin: '0 0 1.25rem', lineHeight: 1.8, color: 'var(--muted)', fontSize: '0.95rem' }}>
              We&apos;re mostly self-funded. Hardware grants from Hack Club HQ cover some projects, but we rely on donations for domains, 3D-printing filament, and day-to-day operating costs.
            </p>
            <Link href="/donate" className="btn-outline" style={{ fontSize: '0.9rem' }}>Donate →</Link>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 'var(--space-5)' }}>
        <div className="card info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', borderColor: 'rgba(200, 190, 255, 0.1)' }}>
          <div
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(236, 55, 80, 0.05) 0%, transparent 60%)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.25rem',
            }}
          >
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// WHEN & WHERE'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {meetingDetails.map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem' }}>
                  <span style={{ color: 'var(--dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', minWidth: 80 }}>{k}</span>
                  <span style={{ color: 'var(--text)', fontSize: '0.88rem', fontWeight: 600, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// FIRST MEETING?'}</p>
            <p style={{ margin: '0 0 1rem', lineHeight: 1.8, color: 'var(--muted)', fontSize: '0.95rem' }}>
              Just show up. You do not need prior experience, a finished idea, or a team. Bring a laptop and we&apos;ll help you get set up.
            </p>
            <p style={{ margin: '0 0 1.25rem', lineHeight: 1.8, color: 'var(--muted)', fontSize: '0.95rem' }}>
              If you want to see the kinds of things members make, browse the gallery or read more about how the club works.
            </p>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              <Link href="/about" className="btn-outline" style={{ fontSize: '0.9rem' }}>Learn more →</Link>
              <Link href="/gallery" className="btn-ghost" style={{ fontSize: '0.9rem' }}>See projects</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
