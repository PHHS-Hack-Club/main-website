import { prisma } from '@/lib/prisma'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

export default async function EventsPage() {
  const now = new Date()

  const allEvents = await prisma.event.findMany({ orderBy: { date: 'asc' } })

  const upcoming = allEvents.filter((ev) => new Date(ev.date) >= now)
  const past = allEvents.filter((ev) => new Date(ev.date) < now).reverse()
  const next = upcoming[0] ?? null
  const rest = upcoming.slice(1)

  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
      <div className="stack">
        <div>
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {'// EVENTS'}
          </p>
          <h1 className="glow-red" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Events</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Special sessions, hack nights, demo days, and more.
          </p>
        </div>

        {allEvents.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
            <p style={{ color: 'var(--muted)', margin: 0 }}>No events yet. Check back soon.</p>
          </div>
        )}

        {/* Next upcoming event — featured */}
        {next && (
          <section className="stack">
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', fontWeight: 700 }}>
              {'// UPCOMING'}
            </p>
            <article
              className="card"
              style={{
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'flex-start',
                background: 'radial-gradient(ellipse 80% 100% at 0% 50%, rgba(255,140,55,0.08) 0%, var(--surface) 70%)',
                borderColor: 'rgba(255,140,55,0.25)',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 62,
                  textAlign: 'center',
                  background: 'var(--raised)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.3rem',
                  border: '1px solid rgba(255,140,55,0.2)',
                }}
              >
                <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--orange)', lineHeight: 1 }}>
                  {new Date(next.date).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })}
                </p>
                <p style={{ margin: '0.2rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {new Date(next.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase()}
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 0.2rem', fontWeight: 800, fontSize: '1.1rem' }}>{next.title}</p>
                <p style={{ margin: 0, color: 'var(--orange)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {dateFmt.format(new Date(next.date))}
                  {next.location && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {next.location}</span>}
                </p>
                {next.description && (
                  <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {next.description}
                  </p>
                )}
              </div>
              <span style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--orange)', paddingTop: '0.15rem' }}>
                NEXT UP
              </span>
            </article>
          </section>
        )}

        {/* All events list */}
        {(rest.length > 0 || past.length > 0) && (
          <section className="stack">
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', fontWeight: 700 }}>
              {'// ALL EVENTS'}
            </p>
            <div className="stack">
              {[...rest, ...past].map((ev) => {
                const isPast = new Date(ev.date) < now
                return (
                  <div
                    key={ev.id}
                    className="card"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 1.1rem', opacity: isPast ? 0.55 : 1 }}
                  >
                    <div>
                      <p style={{ margin: '0 0 0.15rem', fontWeight: 700, fontSize: '0.95rem' }}>{ev.title}</p>
                      <p style={{ margin: 0, color: 'var(--orange)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {dateFmt.format(new Date(ev.date))}
                        {ev.location && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {ev.location}</span>}
                      </p>
                      {ev.description && (
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--dim)', fontSize: '0.82rem' }}>{ev.description}</p>
                      )}
                    </div>
                    {isPast && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--dim)', letterSpacing: '0.08em' }}>PAST</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
