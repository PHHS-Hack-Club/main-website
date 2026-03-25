import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'

const supportAreas = [
  {
    title: 'Hardware And Supplies',
    body: 'Adapters, sensors, soldering tools, cables, microcontrollers, and all the weird little things student projects burn through.',
  },
  {
    title: 'Events And Challenges',
    body: 'Snacks, prizes, showcase nights, mini hackathons, and the kind of club moments that make students keep showing up.',
  },
  {
    title: 'Shipping Projects',
    body: 'Hosting, domains, software credits, printing, and the costs that turn ideas into real finished work.',
  },
]

const sponsorSteps = [
  'Reach out with what you want to support',
  'We match it to a real club need',
  'We add your logo, link, and thank-you on the site',
]

export default async function SponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  const sponsorPreview = sponsors.slice(0, 6)

  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
      <div className="stack" style={{ gap: '1.5rem' }}>
        <section
          className="card"
          style={{
            overflow: 'hidden',
            position: 'relative',
            background:
              'radial-gradient(circle at 0% 0%, rgba(236,55,80,0.16) 0%, rgba(236,55,80,0) 34%), radial-gradient(circle at 100% 20%, rgba(255,140,55,0.16) 0%, rgba(255,140,55,0) 32%), linear-gradient(135deg, rgba(18,16,28,1) 0%, rgba(11,11,18,1) 100%)',
            borderColor: 'rgba(255,140,55,0.16)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(120deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.03) 100%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            <div className="stack" style={{ gap: '0.85rem' }}>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.72rem', letterSpacing: '0.14em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {'// SPONSORS'}
              </p>
              <h1
                className="glow-red"
                style={{
                  fontSize: 'clamp(2.7rem, 5.4vw, 4.7rem)',
                  margin: 0,
                  letterSpacing: '-0.04em',
                  lineHeight: 0.95,
                }}
              >
                Back The Builders
              </h1>
              <p style={{ margin: 0, color: 'var(--muted)', maxWidth: 620, fontSize: '1rem', lineHeight: 1.7 }}>
                PHHS Hack Club runs on momentum, laptops, weird side projects, and the people willing to help students keep making things. Sponsors help us turn weekly meetings into real shipped work.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                <Link href="/contact" className="btn-primary">
                  Sponsor the club
                </Link>
                <Link href="/contact" className="btn-outline">
                  Ask a question
                </Link>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '0.9rem',
                alignItems: 'center',
                justifyItems: 'center',
              }}
            >
              {sponsorPreview.length > 0 ? (
                sponsorPreview.map((sponsor, index) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={sponsor.title}
                    style={{
                      width: index % 3 === 1 ? 104 : 92,
                      height: index % 3 === 1 ? 104 : 92,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background:
                        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 35%, rgba(0,0,0,0.22) 100%)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
                      padding: '1rem',
                      textDecoration: 'none',
                    }}
                  >
                    <img
                      src={getFileUrl(sponsor.logoKey)}
                      alt={sponsor.title}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                    />
                  </a>
                ))
              ) : (
                <div
                  className="card"
                  style={{
                    gridColumn: '1 / -1',
                    width: '100%',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 0.35rem',
                      color: 'var(--orange)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {'// OPEN'}
                  </p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>
                    Looking for sponsors
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {supportAreas.map((area) => (
            <div
              key={area.title}
              className="card"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%), var(--surface)',
                borderColor: 'rgba(255,140,55,0.14)',
              }}
            >
              <p style={{ margin: '0 0 0.35rem', color: 'var(--orange)', fontSize: '0.73rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                SUPPORT
              </p>
              <h2 style={{ margin: '0 0 0.45rem', fontSize: '1rem' }}>{area.title}</h2>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.9rem' }}>
                {area.body}
              </p>
            </div>
          ))}
        </section>

        <section className="stack" style={{ gap: '0.9rem' }}>
          <div>
            <p style={{ margin: '0 0 0.35rem', color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>
              {'// CURRENT SPONSORS'}
            </p>
            <h2 style={{ margin: 0, fontSize: '1.7rem', letterSpacing: '-0.03em' }}>The people helping us keep building</h2>
          </div>

          {sponsors.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                Looking for sponsors. If you want to support the club, reach out through the contact page.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              {sponsors.map((sponsor, index) => (
                <a
                  key={sponsor.id}
                  href={sponsor.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card"
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    minHeight: 250,
                    position: 'relative',
                    overflow: 'hidden',
                    background:
                      index % 2 === 0
                        ? 'radial-gradient(circle at 0% 0%, rgba(236,55,80,0.10) 0%, rgba(236,55,80,0) 40%), linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 100%), var(--surface)'
                        : 'radial-gradient(circle at 100% 0%, rgba(255,140,55,0.10) 0%, rgba(255,140,55,0) 42%), linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 100%), var(--surface)',
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: '50%',
                        background:
                          'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.22) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'grid',
                        placeItems: 'center',
                        padding: '1rem',
                        flexShrink: 0,
                        boxShadow: '0 14px 36px rgba(0,0,0,0.24)',
                      }}
                    >
                      <img
                        src={getFileUrl(sponsor.logoKey)}
                        alt={sponsor.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                      />
                    </div>

                    {sponsor.tier && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.08em',
                          color: 'var(--orange)',
                          padding: '0.3rem 0.55rem',
                          borderRadius: '999px',
                          background: 'rgba(255,140,55,0.08)',
                          border: '1px solid rgba(255,140,55,0.16)',
                        }}
                      >
                        {sponsor.tier.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <p style={{ margin: '0 0 0.3rem', fontWeight: 800, fontSize: '1.1rem' }}>
                      {sponsor.title}
                    </p>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                      {sponsor.description || 'Supporter of PHHS Hack Club.'}
                    </p>
                  </div>

                  <span
                    style={{
                      marginTop: 'auto',
                      color: 'var(--orange)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Visit sponsor →
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section
          className="card"
          style={{
            background:
              'linear-gradient(135deg, rgba(236,55,80,0.08) 0%, rgba(255,140,55,0.04) 50%, rgba(255,255,255,0.015) 100%)',
            borderColor: 'rgba(236,55,80,0.18)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              alignItems: 'start',
            }}
          >
            <div className="stack" style={{ gap: '0.8rem' }}>
              <div>
                <p style={{ margin: '0 0 0.35rem', color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>
                  {'// HOW TO SPONSOR US'}
                </p>
                <h2 style={{ margin: 0, fontSize: '1.7rem', letterSpacing: '-0.03em' }}>
                  Want to back the club?
                </h2>
              </div>

              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
                If you want to support student builders at PHHS, email us with what you have in mind. Cash support, software credits, hardware, snacks, prize funding, and event help all make a real difference.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn-primary">
                  Email us
                </Link>
                <Link href="/contact" className="btn-outline">
                  Contact page
                </Link>
              </div>
            </div>

            <div className="stack" style={{ gap: '0.65rem' }}>
              {sponsorSteps.map((step, index) => (
                <div
                  key={step}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    padding: '0.8rem 0.95rem',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(255,140,55,0.12)',
                      color: 'var(--orange)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
