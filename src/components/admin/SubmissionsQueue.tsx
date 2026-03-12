'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import MarkdownPreview from '@/components/MarkdownPreview'

interface SubmissionItem {
  id: string
  title: string
  author: string
  status: string
  description?: string
  projectTitle?: string | null
  githubUrl?: string | null
  demoUrl?: string | null
  isMarkdown?: boolean
}

interface QueueProps {
  projects: SubmissionItem[]
  devlogs: SubmissionItem[]
}

function SubmissionActions({
  id,
  type,
}: {
  id: string
  type: 'project' | 'devlog'
}) {
  const router = useRouter()
  const [saving, setSaving] = useState<'approve' | 'reject' | null>(null)

  async function update(action: 'approve' | 'reject') {
    setSaving(action)

    const response = await fetch(`/api/admin/submissions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        action,
      }),
    })

    setSaving(null)

    if (response.ok) {
      router.refresh()
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button type="button" className="btn-primary" style={{ minHeight: 36, padding: '0.55rem 0.9rem' }} disabled={saving !== null} onClick={() => update('approve')}>
        {saving === 'approve' ? 'Approving...' : 'Approve'}
      </button>
      <button type="button" className="btn-ghost" style={{ minHeight: 36, padding: '0.55rem 0.9rem', color: 'var(--red)' }} disabled={saving !== null} onClick={() => update('reject')}>
        {saving === 'reject' ? 'Rejecting...' : 'Reject'}
      </button>
    </div>
  )
}

function SubmissionDescription({ description, isMarkdown }: { description: string; isMarkdown: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const isTruncated = description.length > 280

  if (!description) {
    return <p style={{ color: 'var(--muted)', margin: 0 }}>No description provided.</p>
  }

  if (isMarkdown) {
    const source = isTruncated && !expanded ? description.slice(0, 280) : description
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.9rem' }}>
          <MarkdownPreview source={source} />
        </div>
        {isTruncated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!expanded && <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>…</span>}
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <p style={{ color: 'var(--smoke)', margin: 0 }}>
        {isTruncated && !expanded ? description.slice(0, 280) : description}
      </p>
      {isTruncated && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!expanded && <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>…</span>}
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function SubmissionsQueue({ projects, devlogs }: QueueProps) {
  return (
    <div className="stack">
      <section className="stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Projects</h2>
          <span style={{ color: 'var(--muted)' }}>{projects.length} pending</span>
        </div>
        {projects.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--muted)', margin: 0 }}>No pending projects.</p>
          </div>
        ) : (
          <div className="stack">
            {projects.map((project) => (
              <article key={project.id} className="card stack" style={{ gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: '0.4rem' }}>{project.title || 'Untitled project'}</h3>
                    <p style={{ color: 'var(--muted)', margin: 0 }}>by {project.author}</p>
                  </div>
                  <SubmissionActions id={project.id} type="project" />
                </div>
                <SubmissionDescription description={project.description || ''} isMarkdown={project.isMarkdown ?? false} />
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  )}
                  {project.demoUrl && (
                    <a href={project.demoUrl} target="_blank" rel="noreferrer">
                      Demo
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Devlogs</h2>
          <span style={{ color: 'var(--muted)' }}>{devlogs.length} pending</span>
        </div>
        {devlogs.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--muted)', margin: 0 }}>No pending devlogs.</p>
          </div>
        ) : (
          <div className="stack">
            {devlogs.map((devlog) => (
              <article key={devlog.id} className="card stack" style={{ gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: '0.4rem' }}>{devlog.title || 'Untitled devlog'}</h3>
                    <p style={{ color: 'var(--muted)', margin: 0 }}>
                      by {devlog.author}
                      {devlog.projectTitle ? ` • linked to ${devlog.projectTitle}` : ''}
                    </p>
                  </div>
                  <SubmissionActions id={devlog.id} type="devlog" />
                </div>
                <SubmissionDescription description={devlog.description || ''} isMarkdown={devlog.isMarkdown ?? true} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
