import MarkdownPreview from '@/components/MarkdownPreview'
import { prisma } from '@/lib/prisma'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const monthFmt = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export default async function MeetingsPage() {
  const todayStart = new Date(`${new Date().toISOString().split('T')[0]}T00:00:00.000Z`)

  const [upcoming, past] = await Promise.all([
    prisma.meeting.findMany({
      where: { date: { gte: todayStart } },
      orderBy: { date: 'asc' },
    }),
    prisma.meeting.findMany({
      where: { date: { lt: todayStart } },
      orderBy: { date: 'desc' },
    }),
  ])

  const byMonth = new Map<string, typeof past>()
  for (const meeting of past) {
    const key = monthFmt.format(meeting.date)
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(meeting)
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
      <div className="stack">
        <div>
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {'// MEETINGS'}
          </p>
          <h1 className="glow-red" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Meeting Schedule
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Every session counts. Show up, build something, ship it.
          </p>
        </div>

        {upcoming.length > 0 && (
          <section className="stack">
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', fontWeight: 700 }}>
              UPCOMING
            </p>
            {upcoming.map((meeting) => (
              <article
                key={meeting.id}
                className="card"
                style={{
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'flex-start',
                  background: 'radial-gradient(ellipse 80% 100% at 0% 50%, rgba(236,55,80,0.06) 0%, var(--surface) 70%)',
                  borderColor: 'rgba(236,55,80,0.2)',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 56,
                    textAlign: 'center',
                    background: 'var(--raised)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.3rem',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--red)', lineHeight: 1 }}>
                    {new Date(meeting.date).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase()}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.2rem', fontWeight: 800, fontSize: '1.05rem' }}>{meeting.title}</p>
                  <p style={{ margin: 0, color: 'var(--orange)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {dateFmt.format(meeting.date)}
                  </p>
                  {meeting.notes && (
                    <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                      {meeting.notes}
                    </p>
                  )}
                </div>
                <span style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--orange)', paddingTop: '0.15rem' }}>
                  UPCOMING
                </span>
              </article>
            ))}
          </section>
        )}

        {upcoming.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
            <p style={{ color: 'var(--muted)', margin: 0 }}>No upcoming meetings scheduled yet. Check back soon.</p>
          </div>
        )}

        {byMonth.size > 0 && (
          <section className="stack">
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', fontWeight: 700 }}>
              PAST
            </p>
            {[...byMonth.entries()].map(([month, meetings]) => (
              <div key={month} className="stack" style={{ gap: '0.75rem' }}>
                <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {month.toUpperCase()}
                </p>

                {meetings.map((meeting) => (
                  <article key={meeting.id} className="card stack" style={{ gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: '0 0 0.15rem', fontWeight: 700, fontSize: '0.95rem' }}>{meeting.title}</p>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                          {dateFmt.format(meeting.date)}
                        </p>
                      </div>
                    </div>

                    {meeting.summary ? (
                      <div>
                        <p style={{ margin: '0 0 0.35rem', color: 'var(--muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontWeight: 700 }}>
                          SUMMARY
                        </p>
                        <MarkdownPreview source={meeting.summary} fallback="Summary coming soon." />
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.82rem' }}>
                        Summary coming soon.
                      </p>
                    )}

                    {meeting.materials && (
                      <div>
                        <p style={{ margin: '0 0 0.35rem', color: 'var(--muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontWeight: 700 }}>
                          MATERIALS / LINKS
                        </p>
                        <MarkdownPreview source={meeting.materials} fallback="No materials posted." />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
