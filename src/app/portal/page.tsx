import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'

export default async function PortalPage() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  const [projects, devlogs] = await Promise.all([
    prisma.project.findMany({
      where: { memberId: session.memberId },
      orderBy: { updatedAt: 'desc' },
      include: {
        images: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    }),
    prisma.devlog.findMany({
      where: { memberId: session.memberId },
      orderBy: { updatedAt: 'desc' },
      include: {
        project: {
          select: {
            title: true,
          },
        },
      },
    }),
  ])

  return (
    <div className="stack">
      <section className="card animate-up" style={{
        background: 'radial-gradient(ellipse 70% 80% at 5% 50%, rgba(236, 55, 80, 0.06) 0%, var(--surface) 55%)',
        borderColor: 'rgba(200, 190, 255, 0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 0.35rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{'// YOUR DASHBOARD'}</p>
            <h1 className="glow-red" style={{ marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Keep shipping.</h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
              Draft your work, submit it for review, and document progress while it is still fresh.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/portal/projects/new" className="btn-primary">
              + Project
            </Link>
            <Link href="/portal/devlogs/new" className="btn-outline">
              + Devlog
            </Link>
            {isAdmin(session) && (
              <Link href="/admin" className="btn-ghost">
                Admin
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="stack">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Projects</h2>
          <span style={{ color: 'var(--dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{projects.length} total</span>
        </div>
        {projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
            <p style={{ color: 'var(--muted)', margin: '0 0 0.75rem' }}>No projects yet.</p>
            <Link href="/portal/projects/new" className="btn-primary" style={{ fontSize: '0.88rem' }}>Start your first project →</Link>
          </div>
        ) : (
          <div className="grid-cards">
            {projects.map((project) => {
              const thumb = project.images[0]
              return (
                <Link key={project.id} href={`/portal/projects/${project.id}`} className="card card-interactive stack" style={{ padding: 0, overflow: 'hidden', textDecoration: 'none' }}>
                  {thumb ? (
                    <img
                      src={getFileUrl(thumb.minioKey)}
                      alt=""
                      style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ height: 80, background: 'var(--raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>NO_IMAGE</span>
                    </div>
                  )}
                  <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '0.95rem', lineHeight: 1.3 }}>{project.title || 'Untitled project'}</strong>
                      <span className={`status-pill ${project.status}`}>{project.status}</span>
                    </div>
                    <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>
                      {project.description ? project.description.slice(0, 100) : 'No description yet.'}
                    </p>
                    <p style={{ color: 'var(--dim)', margin: 0, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      updated {project.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="stack">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Devlogs</h2>
          <span style={{ color: 'var(--muted)' }}>{devlogs.length} total</span>
        </div>
        {devlogs.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--muted)', margin: 0 }}>No devlogs yet. Write one after your next build session.</p>
          </div>
        ) : (
          <div className="stack">
            {devlogs.map((devlog) => (
              <Link key={devlog.id} href={`/portal/devlogs/${devlog.id}`} className="card card-interactive">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <strong>{devlog.title || 'Untitled devlog'}</strong>
                    {devlog.project && (
                      <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.86rem' }}>
                        Linked to {devlog.project.title || 'Untitled project'}
                      </p>
                    )}
                  </div>
                  <span className={`status-pill ${devlog.status}`}>{devlog.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
