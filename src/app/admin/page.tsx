import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export default async function AdminPage() {
  const todayStart = new Date(`${new Date().toISOString().split('T')[0]}T00:00:00.000Z`)

  const [
    memberCount,
    pendingVerifications,
    pendingProjects,
    pendingDevlogs,
    totalMeetings,
    nextMeeting,
    lastMeeting,
    recentSubmissions,
    pendingMailRequests,
    activeMailboxes,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
    prisma.project.count({ where: { status: 'PENDING' } }),
    prisma.devlog.count({ where: { status: 'PENDING' } }),
    prisma.meeting.count(),
    prisma.meeting.findFirst({
      where: { date: { gte: todayStart } },
      orderBy: { date: 'asc' },
    }),
    prisma.meeting.findFirst({
      where: { date: { lt: todayStart } },
      orderBy: { date: 'desc' },
    }),
    prisma.project.findMany({
      where: { status: { in: ['APPROVED', 'REJECTED'] } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, updatedAt: true, member: { select: { name: true } } },
    }),
    prisma.emailRequest.count({ where: { status: 'PENDING' } }),
    prisma.mailbox.count({ where: { status: 'ACTIVE' } }),
  ])

  // Last meeting attendance rate
  let lastMeetingRate: { count: number; total: number } | null = null
  if (lastMeeting) {
    const [count, total] = await Promise.all([
      prisma.attendanceRecord.count({ where: { date: lastMeeting.date } }),
      prisma.member.count(),
    ])
    lastMeetingRate = { count, total }
  }

  const pendingTotal = pendingVerifications + pendingProjects + pendingDevlogs

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Admin Overview</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          {pendingTotal > 0
            ? `${pendingTotal} item${pendingTotal !== 1 ? 's' : ''} need your attention.`
            : 'Everything is up to date.'}
        </p>
      </div>

      {/* Pending items */}
      <section className="stack">
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
          PENDING
        </p>
        <div className="grid-cards">
          <Link href="/admin/verification" className="card card-interactive">
            <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Verifications</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: pendingVerifications > 0 ? 'var(--red)' : 'var(--text)' }}>
              {pendingVerifications}
            </p>
          </Link>
          <Link href="/admin/submissions" className="card card-interactive">
            <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Projects</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: pendingProjects > 0 ? 'var(--orange)' : 'var(--text)' }}>
              {pendingProjects}
            </p>
          </Link>
          <Link href="/admin/submissions" className="card card-interactive">
            <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Devlogs</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: pendingDevlogs > 0 ? 'var(--orange)' : 'var(--text)' }}>
              {pendingDevlogs}
            </p>
          </Link>
          <Link href="/admin/mail/requests" className="card card-interactive">
            <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Mail Requests</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: pendingMailRequests > 0 ? 'var(--red)' : 'var(--text)' }}>
              {pendingMailRequests}
            </p>
          </Link>
        </div>
      </section>

      {/* Club Email quick links */}
      <section className="stack">
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
          CLUB EMAIL
        </p>
        <div className="grid-cards">
          <Link href="/admin/mail/mailboxes" className="card card-interactive">
            <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Active Mailboxes</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{activeMailboxes}</p>
          </Link>
          <Link href="/admin/mail/requests" className="card card-interactive">
            <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Pending Requests</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: pendingMailRequests > 0 ? 'var(--red)' : 'var(--text)' }}>
              {pendingMailRequests}
            </p>
          </Link>
          <Link href="/admin/mail/audit" className="card card-interactive">
            <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Audit Log</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>→</p>
          </Link>
        </div>
      </section>

      {/* Club stats */}
      <section className="stack">
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
          CLUB
        </p>
        <div className="grid-cards">
          <Link href="/admin/members" className="card card-interactive">
            <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Members</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{memberCount}</p>
          </Link>
          <Link href="/admin/meetings" className="card card-interactive">
            <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Meetings Held</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{totalMeetings}</p>
          </Link>
          {lastMeetingRate && lastMeeting && (
            <Link href="/admin/attendance" className="card card-interactive">
              <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Last Meeting Attendance</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>
                {lastMeetingRate.count}
                <span style={{ fontSize: '1.1rem', color: 'var(--dim)', fontWeight: 400 }}>
                  {' '}/ {lastMeetingRate.total}
                </span>
              </p>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                {dateFmt.format(lastMeeting.date)} · {lastMeeting.title}
              </p>
            </Link>
          )}
        </div>
      </section>

      {/* Next meeting callout */}
      {nextMeeting && (
        <section>
          <Link
            href="/admin/meetings"
            className="card card-interactive"
            style={{
              display: 'block',
              background: 'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(236,55,80,0.07) 0%, var(--surface) 60%)',
            }}
          >
            <p style={{ margin: '0 0 0.35rem', color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
              NEXT MEETING
            </p>
            <p style={{ margin: '0 0 0.2rem', fontWeight: 800, fontSize: '1.15rem' }}>{nextMeeting.title}</p>
            <p style={{ margin: 0, color: 'var(--orange)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}>
              {dateFmt.format(nextMeeting.date)}
            </p>
            {nextMeeting.notes && (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                {nextMeeting.notes}
              </p>
            )}
          </Link>
        </section>
      )}

      {/* Recent submission activity */}
      {recentSubmissions.length > 0 && (
        <section className="stack">
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
            RECENT ACTIVITY
          </p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {recentSubmissions.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.7rem 1.25rem',
                  borderBottom: i < recentSubmissions.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.title || 'Untitled'}</span>
                  <span style={{ color: 'var(--dim)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    by {p.member.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                    color: p.status === 'APPROVED' ? 'var(--green, #33d17a)' : 'var(--red)',
                  }}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
