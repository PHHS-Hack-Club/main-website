import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'
import MarkdownPreview from '@/components/MarkdownPreview'

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

async function buildHoursMap(
  projects: { id: string; hackatimeProject: string | null; member: { id: string; hackatimeToken: string | null } }[]
): Promise<Map<string, string>> {
  // Group by member so we make one API call per member, not per project
  const memberTokens = new Map<string, string>()
  for (const p of projects) {
    if (p.hackatimeProject && p.member.hackatimeToken && !memberTokens.has(p.member.id)) {
      memberTokens.set(p.member.id, p.member.hackatimeToken)
    }
  }

  // Fetch each member's project list once
  const memberProjectSeconds = new Map<string, Map<string, number>>()
  await Promise.all(
    [...memberTokens.entries()].map(async ([memberId, token]) => {
      try {
        const res = await fetch(
          'https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=true',
          { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 3600 } }
        )
        if (!res.ok) return
        const data = await res.json() as { projects: { name: string; total_seconds: number }[] }
        const byName = new Map<string, number>()
        for (const p of data.projects ?? []) byName.set(p.name.toLowerCase(), p.total_seconds)
        memberProjectSeconds.set(memberId, byName)
      } catch {
        // silently skip
      }
    })
  )

  // Build projectId → formatted hours
  const hours = new Map<string, string>()
  for (const p of projects) {
    if (!p.hackatimeProject) continue
    const byName = memberProjectSeconds.get(p.member.id)
    if (!byName) continue
    const seconds = byName.get(p.hackatimeProject.toLowerCase())
    if (seconds) hours.set(p.id, formatSeconds(seconds))
  }
  return hours
}

export default async function GalleryPage() {
  const [projects, devlogs] = await Promise.all([
    prisma.project.findMany({
      where: { status: 'APPROVED' },
      include: {
        member: { select: { id: true, name: true, hackatimeToken: true } },
        images: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.devlog.findMany({
      where: { status: 'APPROVED' },
      include: {
        member: { select: { name: true } },
        project: { select: { title: true, id: true } },
        images: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const hoursMap = await buildHoursMap(projects)

  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
      <div className="stack">
        <div className="animate-up">
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// GALLERY'}</p>
          <h1 className="glow-red" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>What we&apos;ve built.</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>Approved projects and devlogs from PHHS Hack Club members.</p>
        </div>

        <section className="stack">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', letterSpacing: '0.01em' }}>Projects</h2>
            <span style={{ color: 'var(--dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{projects.length} approved</span>
          </div>
          {projects.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No approved projects yet.</p>
            </div>
          ) : (
            <div className="grid-cards">
              {projects.map((project) => {
                const image = project.images[0]
                const hours = hoursMap.get(project.id)
                return (
                  <Link key={project.id} href={`/gallery/${project.id}`} className="card card-interactive stack" style={{ padding: 0, overflow: 'hidden', textDecoration: 'none' }}>
                    {image ? (
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img
                          src={getFileUrl(image.minioKey)}
                          alt={image.originalFilename}
                          style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
                          pointerEvents: 'none',
                        }} />
                        {hours && (
                          <span style={{
                            position: 'absolute',
                            bottom: '0.5rem',
                            right: '0.5rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-pill)',
                            background: 'rgba(0,0,0,0.65)',
                            border: '1px solid rgba(255,140,55,0.35)',
                            color: 'var(--orange)',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                          }}>
                            ⏱ {hours}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ height: 100, background: 'var(--raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>NO_SCREENSHOT</span>
                      </div>
                    )}
                    <div style={{ padding: '0.65rem var(--space-3) var(--space-3)', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                      <div>
                        <h3 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '1.15rem' }}>{project.title || 'Untitled project'}</h3>
                        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>by {project.member.name}</p>
                      </div>
                      {/* <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--muted)' }}>
                        <MarkdownPreview source={project.description.slice(0, 180)} fallback="No description provided." />
                      </div> */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.25rem' }}>
                        <p style={{ color: 'var(--orange)', margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                          View project →
                        </p>
                        {hours && !image && (
                          <span style={{ color: 'var(--orange)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>⏱ {hours}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section className="stack">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', letterSpacing: '0.01em' }}>Devlogs</h2>
            <span style={{ color: 'var(--dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{devlogs.length} approved</span>
          </div>
          {devlogs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No approved devlogs yet.</p>
            </div>
          ) : (
            <div className="stack">
              {devlogs.map((devlog) => {
                const image = devlog.images[0]
                return (
                  <article key={devlog.id} className="card stack" style={{ padding: 0, overflow: 'hidden' }}>
                    {image && (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={getFileUrl(image.minioKey)}
                          alt={image.originalFilename}
                          style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
                          pointerEvents: 'none',
                        }} />
                      </div>
                    )}
                    <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '1rem' }}>{devlog.title || 'Untitled devlog'}</h3>
                        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                          by {devlog.member.name}
                          {devlog.project ? ` · ${devlog.project.title}` : ''}
                        </p>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                        <MarkdownPreview source={devlog.body.slice(0, 220)} fallback="No content provided." />
                      </div>
                      {devlog.project && (
                        <Link href={`/gallery/${devlog.project.id}`} style={{ color: 'var(--orange)', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.25rem' }}>
                          View project →
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
