import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const backStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  color: 'var(--muted)',
  fontSize: '0.82rem',
  fontWeight: 'bold',
} as const

const tagStyle = {
  fontSize: '0.78rem',
  color: 'var(--muted)',
  background: 'var(--raised)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '0.18rem 0.5rem',
} as const

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/')

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id, memberId: session.memberId },
    include: {
      devlogs: { orderBy: { updatedAt: 'desc' } },
    },
  })

  if (!project) notFound()

  return (
    <div className="stack">
      <Link href="/portal" style={backStyle}>
        ← Dashboard
      </Link>

      {/* Project card */}
      <div className="card stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: 'var(--red)', fontWeight: 800, letterSpacing: '0.08em', margin: 0 }}>PROJECT</p>
            <h1 style={{ margin: '0.2rem 0 0' }}>{project.title || 'Untitled project'}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={`status-pill ${project.status}`}>{project.status}</span>
            <Link
              href={`/portal/projects/${project.id}/edit`}
              className="btn-ghost"
              style={{ minHeight: 32, padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
            >
              Edit
            </Link>
          </div>
        </div>

        {project.description && (
          <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>
            {project.description.slice(0, 400)}{project.description.length > 400 ? '…' : ''}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noreferrer"
              style={{ color: 'var(--orange)', fontSize: '0.88rem', fontWeight: 'bold' }}>
              GitHub ↗
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noreferrer"
              style={{ color: 'var(--orange)', fontSize: '0.88rem', fontWeight: 'bold' }}>
              Live Demo ↗
            </a>
          )}
          {project.tags.length > 0 && (
            <>
              {(project.githubUrl || project.demoUrl) && (
                <span style={{ color: 'var(--dim)' }}>·</span>
              )}
              {project.tags.map((tag) => (
                <span key={tag} style={tagStyle}>{tag}</span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Devlogs section */}
      <section className="stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>
            Devlogs
            <span style={{ color: 'var(--muted)', fontWeight: 'normal', fontSize: '0.9rem', marginLeft: '0.6rem' }}>
              {project.devlogs.length}
            </span>
          </h2>
          <Link
            href={`/portal/devlogs/new?projectId=${project.id}`}
            className="btn-primary"
            style={{ minHeight: 36, padding: '0.45rem 1rem', fontSize: '0.88rem' }}
          >
            + New Devlog
          </Link>
        </div>

        {project.devlogs.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              No devlogs yet. Write one after your next build session.
            </p>
          </div>
        ) : (
          <div className="stack">
            {project.devlogs.map((devlog) => (
              <Link key={devlog.id} href={`/portal/devlogs/${devlog.id}`} className="card card-interactive">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{devlog.title || 'Untitled devlog'}</strong>
                    <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
                      {devlog.updatedAt.toLocaleDateString()}
                    </p>
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
