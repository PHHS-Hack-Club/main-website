import { prisma } from '@/lib/prisma'
import AttendanceTracker from '@/components/admin/AttendanceTracker'
import AttendanceViewer from '@/components/admin/AttendanceViewer'

export default async function AttendancePage() {
  const now = new Date()

  // Fetch recent + upcoming meetings so the tracker can show quick-select chips
  const meetings = await prisma.meeting.findMany({
    where: {
      date: {
        gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // last 30 days
      },
    },
    orderBy: { date: 'asc' },
    select: { id: true, title: true, date: true },
  })

  const meetingChips = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    date: m.date.toISOString().split('T')[0],
  }))

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Attendance</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Mark who showed up, then review history by meeting or member.
        </p>
      </div>

      <section className="stack">
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontWeight: 700 }}>
          // TAKE ATTENDANCE
        </p>
        <AttendanceTracker meetings={meetingChips} />
      </section>

      <section className="stack">
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontWeight: 700 }}>
          // HISTORY
        </p>
        <AttendanceViewer />
      </section>
    </div>
  )
}
