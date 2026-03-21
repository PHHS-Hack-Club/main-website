'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload, { UploadedImage } from '@/components/ImageUpload'
import MarkdownEditor from '@/components/MarkdownEditor'
import Toast, { ToastMessage } from '@/components/Toast'

interface ProjectData {
  id: string
  title: string
  description: string
  githubUrl: string | null
  demoUrl: string | null
  tags: string[]
  status: string
  hackatimeProject: string | null
  images: UploadedImage[]
}

export default function EditProjectPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [status, setStatus] = useState('')
  const [hackatimeProject, setHackatimeProject] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // Hackatime
  const [hackatimeConnected, setHackatimeConnected] = useState(false)
  const [hackatimeProjects, setHackatimeProjects] = useState<string[]>([])
  const [hackatimeLoading, setHackatimeLoading] = useState(true)

  const addToast = useCallback((text: string, variant: 'success' | 'error') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, text, variant }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    async function loadProject() {
      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) throw new Error('Failed to load project')
        const project: ProjectData = await response.json()
        setTitle(project.title)
        setDescription(project.description)
        setGithubUrl(project.githubUrl || '')
        setDemoUrl(project.demoUrl || '')
        setTags(project.tags.join(', '))
        setStatus(project.status)
        setHackatimeProject(project.hackatimeProject || '')
        setImages(project.images || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    loadProject()
  }, [params.id])

  useEffect(() => {
    fetch('/api/hackatime/projects')
      .then((r) => r.json())
      .then((data) => {
        setHackatimeConnected(data.connected ?? false)
        setHackatimeProjects(data.projects ?? [])
      })
      .catch(() => {})
      .finally(() => setHackatimeLoading(false))
  }, [])

  useEffect(() => {
    if (searchParams.get('hackatime_connected') === '1') {
      addToast('Hackatime connected!', 'success')
    } else if (searchParams.get('hackatime_error')) {
      addToast('Failed to connect Hackatime', 'error')
    }
  }, [searchParams, addToast])

  // Debounced auto-save
  useEffect(() => {
    if (!params.id || loading) return
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            githubUrl,
            demoUrl,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            images: images.map((img) => ({ key: img.key, filename: img.filename })),
            hackatimeProject: hackatimeProject || null,
            submit: false,
          }),
        })
        if (response.ok) {
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          addToast(`Saved at ${time}`, 'success')
        }
      } catch {
        addToast('Failed to save', 'error')
      }
    }, 3500)

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    }
  }, [title, description, githubUrl, demoUrl, tags, images, hackatimeProject, params.id, loading, addToast])

  async function save(submit: boolean) {
    setSaving(true)
    setError('')

    if (!githubUrl.trim()) {
      setError('GitHub URL is required.')
      setSaving(false)
      return
    }

    if (submit && images.length === 0) {
      setError('At least one screenshot or header image is required to submit.')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          githubUrl,
          demoUrl,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          images: images.map((img) => ({ key: img.key, filename: img.filename })),
          hackatimeProject: hackatimeProject || null,
          submit,
        }),
      })
      if (!response.ok) throw new Error('Failed to update project')
      router.push(`/portal/projects/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this project and all its devlogs?')) return
    const response = await fetch(`/api/projects/${params.id}`, { method: 'DELETE' })
    if (response.ok) {
      router.push('/portal')
    } else {
      setError('Failed to delete project')
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading…</p>

  const hackatimeLoginUrl = `/api/auth/hackatime/login?returnTo=${encodeURIComponent(`/portal/projects/${params.id}/edit`)}`

  return (
    <>
    <Toast toasts={toasts} onDismiss={dismissToast} />
    <div className="card stack">
      <Link
        href={`/portal/projects/${params.id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}
      >
        ← {title || 'Project'}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: 'var(--red)', fontWeight: 800, letterSpacing: '0.08em', margin: 0 }}>EDIT PROJECT</p>
          <h1 style={{ marginBottom: '0.5rem' }}>{title || 'Untitled project'}</h1>
        </div>
        <span className={`status-pill ${status}`}>{status}</span>
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" className="field" />
      <MarkdownEditor value={description} onChange={setDescription} />
      <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub URL *" className="field" required />
      <input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="Demo URL (optional)" className="field" />
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" className="field" />
      <ImageUpload
        images={images}
        onUpload={(img) => setImages((cur) => [...cur, img])}
        onRemove={(key) => setImages((cur) => cur.filter((img) => img.key !== key))}
      />

      {/* Hackatime */}
      <div
        className="surface"
        style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
              Hackatime
              {hackatimeConnected && (
                <span style={{ marginLeft: '0.5rem', color: 'var(--green)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>● connected</span>
              )}
            </p>
            <p style={{ margin: '0.15rem 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
              Link a Hackatime project to show logged time on your gallery page.
            </p>
          </div>
          {!hackatimeConnected && !hackatimeLoading && (
            <a href={hackatimeLoginUrl} className="btn-outline" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              Connect Hackatime →
            </a>
          )}
          {hackatimeConnected && (
            <a href={hackatimeLoginUrl} style={{ color: 'var(--dim)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
              Reconnect
            </a>
          )}
        </div>

        {hackatimeConnected && (
          hackatimeProjects.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
              No Hackatime projects found yet  start logging time and they&apos;ll appear here.
            </p>
          ) : (
            <select
              value={hackatimeProject}
              onChange={(e) => setHackatimeProject(e.target.value)}
              className="field"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}
            >
              <option value=""> select a project</option>
              {hackatimeProjects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )
        )}
      </div>

      {error && <p style={{ color: 'var(--red)', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => save(false)} className="btn-outline" disabled={saving}>
            Save Draft
          </button>
          <button type="button" onClick={() => save(true)} className="btn-primary" disabled={saving}>
            Submit for Review
          </button>
          <button type="button" onClick={handleDelete} className="btn-ghost" style={{ color: 'var(--red)' }}>
            Delete
          </button>
        </div>
        {images.length === 0 && status === 'DRAFT' && <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.82rem' }}>Image required to submit</p>}
      </div>
    </div>
    </>
  )
}
