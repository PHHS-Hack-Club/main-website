import Link from 'next/link'
import { prisma } from '@/lib/prisma'

function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })
}

async function fetchMemberSeconds(
  token: string,
  start: string,
  end: string
): Promise<number> {
  try {
    const params = new URLSearchParams({
      start_date: start,
      end_date: end,
    })
    const res = await fetch(`https://hackatime.hackclub.com/api/v1/authenticated/hours?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 1800 },
    })
    if (!res.ok) return 0

    const data = await res.json() as { total_seconds?: number }
    return data.total_seconds ?? 0
  } catch {
    return 0
  }
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const now = new Date()
  const params = await searchParams
  const raw = typeof params?.month === 'string' ? params.month : ''
  const match = raw.match(/^(\d{4})-(\d{2})$/)
  const year = match ? parseInt(match[1]) : now.getFullYear()
  const month = match ? parseInt(match[2]) : now.getMonth() + 1

  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${year}-${pad(month)}-01`
  const end = `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const prevParam = `${prevYear}-${pad(prevMonth)}`
  const nextParam = `${nextYear}-${pad(nextMonth)}`

  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1
  const isFuture =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month > now.getMonth() + 1)

  const members = await prisma.member.findMany({
    where: { hackatimeToken: { not: null } },
    select: { name: true, hackatimeToken: true },
  })

  const rows = await Promise.all(
    members.map(async (m) => ({
      name: m.name,
      seconds: await fetchMemberSeconds(m.hackatimeToken!, start, end),
    })),
  )

  const ranked = rows
    .filter((r) => r.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)

  const topSeconds = ranked[0]?.seconds ?? 1

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}
    >
      <div className="stack">

        <div className="animate-up">
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {'// LEADERBOARD'}
          </p>
          <h1 className="glow-red" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Hours coded.
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
            Ranked by Hackatime hours for {monthLabel(year, month)}.
          </p>
        </div>

        {/* month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href={`/leaderboard?month=${prevParam}`}
            className="btn-ghost"
            style={{ fontSize: '0.85rem', minHeight: 36, padding: '0.4rem 1rem' }}
          >
            ← {monthLabel(prevYear, prevMonth).split(' ')[0]}
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)', flex: 1, textAlign: 'center' }}>
            {monthLabel(year, month)}
          </span>
          {!isCurrent && !isFuture ? (
            <Link
              href={`/leaderboard?month=${nextParam}`}
              className="btn-ghost"
              style={{ fontSize: '0.85rem', minHeight: 36, padding: '0.4rem 1rem' }}
            >
              {monthLabel(nextYear, nextMonth).split(' ')[0]} →
            </Link>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--dim)', minWidth: 80, textAlign: 'right' }}>
              current
            </span>
          )}
        </div>

        {/* rankings */}
        <section className="stack">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Rankings</h2>
            <span style={{ color: 'var(--dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              {ranked.length} members
            </span>
          </div>

          {ranked.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                No Hackatime data for this month yet.
              </p>
            </div>
          ) : (
            <div className="stack">
              {ranked.map((entry, i) => {
                const pct = Math.round((entry.seconds / topSeconds) * 100)
                const medal =
                  i === 0 ? 'var(--yellow)'
                  : i === 1 ? 'var(--muted)'
                  : i === 2 ? 'var(--orange)'
                  : 'var(--dim)'
                return (
                  <div
                    key={entry.name}
                    className="card animate-up"
                    style={{ padding: 'var(--space-3)', animationDelay: `${0.04 * i}s` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: medal, minWidth: 28 }}>
                        #{i + 1}
                      </span>
                      <span style={{ fontWeight: 700, flex: 1 }}>{entry.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--orange)' }}>
                        {formatSeconds(entry.seconds)}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 'var(--radius-pill)', background: 'var(--raised)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 'var(--radius-pill)',
                        background: i === 0 ? 'var(--red)' : 'rgba(236, 55, 80, 0.4)',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
