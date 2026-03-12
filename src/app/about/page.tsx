export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
      <div className="card stack">
        <p style={{ color: 'var(--red)', fontWeight: 800, letterSpacing: '0.08em', margin: 0 }}>ABOUT THE CLUB</p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', margin: 0 }}>A room full of builders.</h1>
        <p style={{ color: 'var(--smoke)', maxWidth: 720, lineHeight: 1.8 }}>
          PHHS Hack Club is a student-run programming club for people who want to make real things. We run work sessions,
          ship projects, help each other debug, and keep a record of what we are building through projects and devlogs.
        </p>
        <div className="grid-cards">
          <article className="card card-interactive">
            <h2>What we do</h2>
            <p style={{ color: 'var(--muted)' }}>Web apps, bots, hardware experiments, design systems, event tools, and whatever else members want to build.</p>
          </article>
          <article className="card card-interactive">
            <h2>How it works</h2>
            <p style={{ color: 'var(--muted)' }}>Members join through Hack Club auth, create projects, post devlogs, and submit their work for gallery approval.</p>
          </article>
          <article className="card card-interactive">
            <h2>Why Hack Club</h2>
            <p style={{ color: 'var(--muted)' }}>We use the official Hack Club ecosystem because it rewards building, sharing, and actually learning by making.</p>
          </article>
        </div>
      </div>
    </div>
  )
}
