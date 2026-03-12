import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'
import MarkdownPreview from '@/components/MarkdownPreview'

export default async function GalleryProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id, status: 'APPROVED' },
    include: {
      member: { select: { name: true } },
      images: { orderBy: { createdAt: 'asc' } },
      devlogs: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'asc' },
        include: {
          images: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  })

  if (!project) notFound()

  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-6)' }}>
      <div className="stack">

        {/* Back */}
        <Link
          href="/gallery"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}
        >
          ← Gallery
        </Link>

        {/* Header */}
        <div className="card animate-up" style={{
          background: 'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(236, 55, 80, 0.06) 0%, var(--surface) 60%)',
          borderColor: 'rgba(200, 190, 255, 0.12)',
        }}>
          <p style={{ margin: '0 0 0.35rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// PROJECT'}</p>
          <h1 className="glow-red" style={{ margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>{project.title || 'Untitled project'}</h1>
          <p style={{ margin: '0 0 1.25rem', color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
            by {project.member.name}
          </p>

          {/* Links + tags */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer"
                style={{ color: 'var(--orange)', fontSize: '0.88rem', fontWeight: 700 }}>
                GitHub ↗
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer"
                style={{ color: 'var(--cyan)', fontSize: '0.88rem', fontWeight: 700 }}>
                Demo ↗
              </a>
            )}
            {project.tags.length > 0 && (
              <>
                {(project.githubUrl || project.demoUrl) && <span style={{ color: 'var(--dim)' }}>·</span>}
                {project.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: '0.78rem',
                    color: 'var(--muted)',
                    background: 'var(--raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.18rem 0.5rem',
                  }}>
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// DESCRIPTION'}</p>
          <MarkdownPreview source={project.description} fallback="No description provided." />
        </div>

        {/* Screenshots */}
        {project.images.length > 0 && (
          <section className="stack">
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Screenshots</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-2)',
            }}>
              {project.images.map((image) => (
                <a key={image.id} href={getFileUrl(image.minioKey)} target="_blank" rel="noreferrer"
                  style={{ display: 'block', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img
                    src={getFileUrl(image.minioKey)}
                    alt={image.originalFilename}
                    style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block', transition: 'transform 300ms ease' }}
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Devlogs */}
        {project.devlogs.length > 0 && (
          <section className="stack">
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
              Devlogs
              <span style={{ color: 'var(--muted)', fontWeight: 'normal', fontSize: '0.9rem', marginLeft: '0.6rem' }}>
                {project.devlogs.length}
              </span>
            </h2>
            <div className="stack">
              {project.devlogs.map((devlog) => (
                <article key={devlog.id} className="card stack" style={{ padding: 0, overflow: 'hidden' }}>
                  {devlog.images.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={getFileUrl(devlog.images[0].minioKey)}
                        alt={devlog.images[0].originalFilename}
                        style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
                        pointerEvents: 'none',
                      }} />
                    </div>
                  )}
                  <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{devlog.title || 'Untitled devlog'}</h3>
                      <p style={{ margin: '0.2rem 0 0', color: 'var(--dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        {devlog.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <MarkdownPreview source={devlog.body} fallback="No content." />
                    {devlog.images.length > 1 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '0.5rem',
                      }}>
                        {devlog.images.slice(1).map((img) => (
                          <a key={img.id} href={getFileUrl(img.minioKey)} target="_blank" rel="noreferrer"
                            style={{ display: 'block', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <img
                              src={getFileUrl(img.minioKey)}
                              alt={img.originalFilename}
                              style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
