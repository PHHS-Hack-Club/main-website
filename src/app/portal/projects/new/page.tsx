'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload, { UploadedImage } from '@/components/ImageUpload'
import MarkdownEditor from '@/components/MarkdownEditor'
import Toast, { ToastMessage } from '@/components/Toast'

export default function NewProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const projectIdRef = useRef<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [hackatimeProject, setHackatimeProject] = useState('')
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [error, setError] = useState('')

  // Hackatime connection state
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

  // Fetch Hackatime connection status on mount
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

  // Show toast if just connected via OAuth
  useEffect(() => {
    if (searchParams.get('hackatime_connected') === '1') {
      addToast('Hackatime connected!', 'success')
    } else if (searchParams.get('hackatime_error')) {
      addToast('Failed to connect Hackatime', 'error')
    }
  }, [searchParams, addToast])

  // Debounced auto-save (3.5s)
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      const imagePayload = images.map((image) => ({ key: image.key, filename: image.filename }))
      const tagList = tags.split(',').map((tag) => tag.trim()).filter(Boolean)

      try {
        if (projectIdRef.current) {
          const response = await fetch(`/api/projects/${projectIdRef.current}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, githubUrl, demoUrl, tags: tagList, images: imagePayload, hackatimeProject: hackatimeProject || null, submit: false }),
          })
          if (response.ok) {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            addToast(`Saved at ${time}`, 'success')
          }
        } else if (title.trim() || description.trim()) {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, githubUrl, demoUrl, tags: tagList, images: imagePayload, hackatimeProject: hackatimeProject || null, submit: false }),
          })
          if (response.ok) {
            const project = await response.json()
            projectIdRef.current = project.id
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            addToast(`Saved at ${time}`, 'success')
          }
        }
      } catch {
        addToast('Failed to save', 'error')
      }
    }, 3500)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [title, description, githubUrl, demoUrl, tags, images, hackatimeProject, addToast])

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

    if (submit && !hackatimeProject) {
      setError('Select a Hackatime project to show coding hours on your submission.')
      setSaving(false)
      return
    }

    try {
      const body = {
        title,
        description,
        githubUrl,
        demoUrl,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        images: images.map((image) => ({ key: image.key, filename: image.filename })),
        hackatimeProject: hackatimeProject || null,
        submit,
      }

      if (projectIdRef.current) {
        const response = await fetch(`/api/projects/${projectIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!response.ok) throw new Error('Failed to update project')
        const project = await response.json()
        router.push(`/portal/projects/${project.id}`)
      } else {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!response.ok) throw new Error('Failed to save project')
        const project = await response.json()
        router.push(`/portal/projects/${project.id}`)
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  // Build the returnTo URL for Hackatime OAuth — include the draft project id if we have one
  const hackatimeLoginUrl = `/api/auth/hackatime/login?returnTo=${encodeURIComponent(
    projectIdRef.current ? `/portal/projects/${projectIdRef.current}/edit` : '/portal/projects/new'
  )}`

  return (
    <>
    <Toast toasts={toasts} onDismiss={dismissToast} />
    <div className="card stack">
      <Link href="/portal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Dashboard
      </Link>
      <div>
        <p style={{ color: 'var(--red)', fontWeight: 800, letterSpacing: '0.08em', margin: 0 }}>NEW PROJECT</p>
        <h1 style={{ marginBottom: '0.5rem' }}>Start something worth showing.</h1>
      </div>

      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Project title" className="field" />
      <MarkdownEditor value={description} onChange={setDescription} />
      <input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="GitHub URL *" className="field" required />
      <input value={demoUrl} onChange={(event) => setDemoUrl(event.target.value)} placeholder="Demo URL (optional)" className="field" />
      <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags (comma separated)" className="field" />
      <ImageUpload
        images={images}
        onUpload={(image) => setImages((current) => [...current, image])}
        onRemove={(key) => setImages((current) => current.filter((image) => image.key !== key))}
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
              Link a Hackatime project to show coding hours on your gallery page.
            </p>
          </div>
          {!hackatimeConnected && !hackatimeLoading && (
            <a href={hackatimeLoginUrl} className="btn-outline" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              Connect Hackatime →
            </a>
          )}
        </div>

        {hackatimeConnected && (
          hackatimeProjects.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
              No Hackatime projects found yet — start coding and they&apos;ll appear here.
            </p>
          ) : (
            <select
              value={hackatimeProject}
              onChange={(e) => setHackatimeProject(e.target.value)}
              className="field"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}
            >
              <option value="">— select a project *</option>
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
        </div>
        {images.length === 0 && <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.82rem' }}>Image required to submit</p>}
      </div>
    </div>
    </>
  )
}
