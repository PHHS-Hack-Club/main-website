'use client'

import { useState } from 'react'
import Link from 'next/link'
import MarkdownPreview from '@/components/MarkdownPreview'

interface GalleryProject {
  id: string
  title: string
  description: string
  tags: string[]
  memberName: string
  imageUrl: string | null
  imageAlt: string | null
  hours: string | null
}

interface GalleryDevlog {
  id: string
  title: string
  body: string
  memberName: string
  projectTitle: string | null
  projectId: string | null
  imageUrl: string | null
  imageAlt: string | null
}

interface GallerySearchProps {
  projects: GalleryProject[]
  devlogs: GalleryDevlog[]
}

export default function GallerySearch({ projects, devlogs }: GallerySearchProps) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'projects' | 'devlogs'>('projects')

  const q = query.toLowerCase().trim()

  const filteredProjects = q
    ? projects.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.memberName.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      )
    : projects

  const filteredDevlogs = q
    ? devlogs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.memberName.toLowerCase().includes(q) ||
          (d.projectTitle && d.projectTitle.toLowerCase().includes(q)) ||
          d.body.toLowerCase().includes(q)
      )
    : devlogs

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search projects, members, tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="field"
          style={{ flex: 1, minWidth: 200 }}
        />
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            className={tab === 'projects' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTab('projects')}
          >
            Projects ({filteredProjects.length})
          </button>
          <button
            type="button"
            className={tab === 'devlogs' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTab('devlogs')}
          >
            Devlogs ({filteredDevlogs.length})
          </button>
        </div>
      </div>

      {tab === 'projects' && (
        <section className="stack">
          {filteredProjects.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                {q ? 'No projects match your search.' : 'No approved projects yet.'}
              </p>
            </div>
          ) : (
            <div className="grid-cards">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/gallery/${project.id}`}
                  className="card card-interactive stack"
                  style={{ padding: 0, overflow: 'hidden', textDecoration: 'none' }}
                >
                  {project.imageUrl ? (
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={project.imageUrl}
                        alt={project.imageAlt || ''}
                        style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
                          pointerEvents: 'none',
                        }}
                      />
                      {project.hours && (
                        <span
                          style={{
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
                          }}
                        >
                          ⏱ {project.hours}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 100,
                        background: 'var(--raised)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        NO_SCREENSHOT
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      padding: '0.65rem var(--space-3) var(--space-3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      flex: 1,
                    }}
                  >
                    <div>
                      <h3 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '1.15rem' }}>
                        {project.title || 'Untitled project'}
                      </h3>
                      <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        by {project.memberName}
                      </p>
                    </div>
                    {project.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: 'var(--radius-pill)',
                              background: 'var(--raised)',
                              color: 'var(--muted)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 'auto',
                        paddingTop: '0.25rem',
                      }}
                    >
                      <p style={{ color: 'var(--orange)', margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                        View project →
                      </p>
                      {project.hours && !project.imageUrl && (
                        <span style={{ color: 'var(--orange)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                          ⏱ {project.hours}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'devlogs' && (
        <section className="stack">
          {filteredDevlogs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                {q ? 'No devlogs match your search.' : 'No approved devlogs yet.'}
              </p>
            </div>
          ) : (
            <div className="stack">
              {filteredDevlogs.map((devlog) => (
                <article key={devlog.id} className="card stack" style={{ padding: 0, overflow: 'hidden' }}>
                  {devlog.imageUrl && (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={devlog.imageUrl}
                        alt={devlog.imageAlt || ''}
                        style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  )}
                  <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '1rem' }}>
                        {devlog.title || 'Untitled devlog'}
                      </h3>
                      <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        by {devlog.memberName}
                        {devlog.projectTitle ? ` · ${devlog.projectTitle}` : ''}
                      </p>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                      <MarkdownPreview source={devlog.body.slice(0, 220)} fallback="No content provided." />
                    </div>
                    {devlog.projectId && (
                      <Link
                        href={`/gallery/${devlog.projectId}`}
                        style={{ color: 'var(--orange)', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.25rem' }}
                      >
                        View project →
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  )
}
