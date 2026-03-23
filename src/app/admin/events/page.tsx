import { prisma } from '@/lib/prisma'
import EventManager from '@/components/admin/EventManager'

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({ orderBy: { date: 'asc' } })

  return (
    <div className="stack">
      <div>
        <p style={{ margin: '0 0 0.4rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          // EVENTS
        </p>
        <h1 style={{ margin: 0, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Events</h1>
        <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0' }}>
          One-off events that appear on the public events page.
        </p>
      </div>
      <EventManager initialEvents={events} />
    </div>
  )
}
