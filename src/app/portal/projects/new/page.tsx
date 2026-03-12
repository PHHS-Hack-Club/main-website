'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload, { UploadedImage } from '@/components/ImageUpload'
import MarkdownEditor from '@/components/MarkdownEditor'
import Toast, { ToastMessage } from '@/components/Toast'

export default function NewProjectPage() {
  const router = useRouter()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const projectIdRef = useRef<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [error, setError] = useState('')

  const addToast = useCallback((text: string, variant: 'success' | 'error') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, text, variant }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

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
            body: JSON.stringify({ title, description, githubUrl, demoUrl, tags: tagList, images: imagePayload, submit: false }),
          })
          if (response.ok) {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            addToast(`Saved at ${time}`, 'success')
          }
        } else if (title.trim() || description.trim()) {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, githubUrl, demoUrl, tags: tagList, images: imagePayload, submit: false }),
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
  }, [title, description, githubUrl, demoUrl, tags, images, addToast])

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
      const body = {
        title,
        description,
        githubUrl,
        demoUrl,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        images: images.map((image) => ({
          key: image.key,
          filename: image.filename,
        })),
        submit,
      }

      if (projectIdRef.current) {
        // Update existing draft
        const response = await fetch(`/api/projects/${projectIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error('Failed to update project')
        }

        const project = await response.json()
        router.push(`/portal/projects/${project.id}`)
      } else {
        // Create new project
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error('Failed to save project')
        }

        const project = await response.json()
        router.push(`/portal/projects/${project.id}`)
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

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
