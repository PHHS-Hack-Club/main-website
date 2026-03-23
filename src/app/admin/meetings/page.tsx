import MeetingManager from '@/components/admin/MeetingManager'

export default function MeetingsPage() {
  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Meetings</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Schedule meetings and track attendance. Dates you create here appear on the public events page.
        </p>
      </div>
      <MeetingManager />
    </div>
  )
}
