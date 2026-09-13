import Link from 'next/link'

const whatWeBuild = [
  { label: 'Web Apps', desc: 'Personal sites, full-stack tools, APIs, dashboards shipped to a real URL.' },
  { label: 'Games', desc: 'Browser games, Sprig cartridges, Unity experiments. Playable, not just planned.' },
  { label: '3D Printing', desc: 'CAD models turned into physical objects keychains, desk organizers, props.' },
  { label: 'Hardware', desc: 'Microcontrollers, sensors, circuits. Code that talks to the physical world.' },
  { label: 'Bots & Scripts', desc: 'Discord bots, automation scripts, CLI tools, scraping projects.' },
  { label: 'Whatever Else', desc: "There's no curriculum. If you want to build it, we'll help you figure it out." },
]

const steps = [
  { num: '01', title: 'Get a Hack Club account', desc: 'Be a Pascack Hills High School student, then sign up at hackclub.com. It\'s free and connects you to a global community of student hackers.' },
  { num: '02', title: 'Come to a meeting', desc: 'Show up on a meeting day ready to build something.' },
  { num: '03', title: 'Come to a meeting', desc: 'Attend regularly to learn more skills through our weekly workshops.' },
  { num: '04', title: 'Start a project', desc: 'Pick something you actually want to make. We help you scope it, start it, and ship it.' },
  { num: '05', title: 'Ship & share', desc: 'Post a devlog, submit to the gallery, and get feedback from the club. Repeat.' },
]

const values = [
  {
    label: 'Build over talk',
    desc: 'We measure ourselves by what we ship, not what we plan. Imperfect and done beats perfect and never started.',
  },
  {
    label: 'No gatekeeping',
    desc: "Beginners and veterans work in the same room. If you don't know something, someone here does or we figure it out together.",
  },
  {
    label: 'Transparent by default',
    desc: 'Our projects are public. Our finances run through Hack Club HCB. Nothing to hide.',
  },
]

export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-6)' }}>
      <div className="stack">

        {/* Hero */}
        <div className="animate-up">
          <p style={{ margin: '0 0 0.5rem', color: 'var(--red)', fontWeight: 800, letterSpacing: '0.12em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>{'// ABOUT THE CLUB'}</p>
          <h1 className="glow-red" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>A room full of builders.</h1>
          <p style={{ color: 'var(--muted)', maxWidth: 680, lineHeight: 1.8, margin: 0, fontSize: '1rem' }}>
            PHHS Coding Club is the Pascack Hills High School chapter of the global{' '}
            <a href="https://hackclub.com" target="_blank" rel="noreferrer" style={{ color: 'var(--orange)' }}>Hack Club</a>{' '}
            network. We&apos;re a student-run club for people who want to make real things
            websites, games, hardware experiments, bots, 3D-printed objects, art, and whatever else.
            No experience required. No grades. Just building.
          </p>
        </div>

        {/* Values */}
        <section className="stack">
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// HOW WE OPERATE'}</p>
          <div className="grid-cards">
            {values.map((v, i) => (
              <article
                key={v.label}
                className="card card-interactive animate-up"
                style={{ animationDelay: `${0.06 * i}s` }}
              >
                <h2 style={{ marginTop: 0, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>{v.label}</h2>
                <p style={{ marginBottom: 0, color: 'var(--muted)', lineHeight: 1.75, fontSize: '0.9rem' }}>{v.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* What we build */}
        <section className="stack">
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// WHAT WE BUILD'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-2)' }}>
            {whatWeBuild.map((item, i) => (
              <div
                key={item.label}
                className="surface animate-up"
                style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius)', animationDelay: `${0.05 * i}s` }}
              >
                <p style={{ margin: '0 0 0.35rem', fontWeight: 700, fontSize: '0.92rem', color: 'var(--orange)' }}>{item.label}</p>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.83rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to join */}
        <section className="stack">
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// HOW TO JOIN'}</p>
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              {steps.map((step, i) => (
                <div key={step.num} className="animate-up" style={{ animationDelay: `${0.07 * i}s` }}>
                  <p style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: 'rgba(236, 55, 80, 0.25)', lineHeight: 1 }}>{step.num}</p>
                  <p style={{ margin: '0 0 0.35rem', fontWeight: 700, fontSize: '0.95rem' }}>{step.title}</p>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Meeting info + Hack Club network */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }} className="info-grid">
          <div
            className="card"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(236, 55, 80, 0.05) 0%, var(--surface) 60%)',
              borderColor: 'rgba(236, 55, 80, 0.15)',
            }}
          >
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// WHEN & WHERE'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { k: 'Day', v: 'Every Thursday' },
                { k: 'Time', v: '3:00 – 4:00 PM' },
                { k: 'Location', v: 'Room 255 · Pascack Hills High School' },
                { k: 'Open to', v: 'All Pascack Hills High School students - any grade, any skill level' },
              ].map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem' }}>
                  <span style={{ color: 'var(--dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', minWidth: 80 }}>{k}</span>
                  <span style={{ color: 'var(--snow)', fontSize: '0.88rem', fontWeight: 600, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// HACK CLUB NETWORK'}</p>
            <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75 }}>
              We&apos;re one of 4,000+ high school chapters in the global Hack Club network, a 501(c)(3) non-profit run from Burlington, Vermont.
              Members get access to grants, hardware, real-world programs, and a huge community of students who love making things.
            </p>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75 }}>
              Our finances are managed transparently through{' '}
              <a href="https://hcb.hackclub.com" target="_blank" rel="noreferrer" style={{ color: 'var(--orange)' }}>Hack Club Bank (HCB)</a>
              every transaction is publicly visible.
            </p>
            <a href="https://hackclub.com" target="_blank" rel="noreferrer" className="btn-outline" style={{ fontSize: '0.88rem' }}>
              hackclub.com ↗
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="card" style={{ textAlign: 'center', padding: 'var(--space-5)', background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(236, 55, 80, 0.06) 0%, var(--surface) 70%)' }}>
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// READY?'}</p>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', letterSpacing: '-0.02em' }}>Come build something.</h2>
          <p style={{ color: 'var(--muted)', maxWidth: 480, marginInline: 'auto', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Show up Thursday. We&apos;ll help you find a project, get unblocked, and leave with real progress on something you actually care about.
          </p>
          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/gallery" className="btn-outline">See what we&apos;ve built</Link>
            <Link href="/mailing-list" className="btn-outline">Join the mailing list</Link>
            <a href="mailto:hack@phhs.edu" className="btn-primary">Get in touch →</a>
          </div>
        </section>

      </div>
    </div>
  )
}
