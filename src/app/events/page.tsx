const events = [
  {
    title: 'Weekly Build Night',
    time: 'Wednesdays • 3:15 PM',
    body: 'Open work session for coding, design, feedback, and asking for help when something is blocked.',
  },
  {
    title: 'Demo Day',
    time: 'Monthly',
    body: 'Members present projects, share what changed, and collect ideas for the next sprint.',
  },
  {
    title: 'Hack Sessions',
    time: 'Seasonal',
    body: 'Focused mini-hackathons around a prompt, local problem, or club challenge.',
  },
]

export default function EventsPage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
      <div className="stack">
        <div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0.75rem' }}>Events</h1>
          <p style={{ color: 'var(--muted)', maxWidth: 680 }}>
            The schedule changes through the semester, but the goal stays the same: keep momentum and keep building.
          </p>
        </div>
        <div className="grid-cards">
          {events.map((event) => (
            <article key={event.title} className="card card-interactive">
              <p style={{ color: 'var(--orange)', fontWeight: 800, letterSpacing: '0.08em', marginTop: 0 }}>{event.time}</p>
              <h2>{event.title}</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>{event.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
