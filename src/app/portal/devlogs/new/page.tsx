'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload, { UploadedImage } from '@/components/ImageUpload'
import MarkdownEditor from '@/components/MarkdownEditor'

interface ProjectOption {
  id: string
  title: string
}

export default function NewDevlogPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [images, setImages] = useState<UploadedImage[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/devlogs')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data)
        }
      })
      .catch(() => {
        setError('Failed to load projects')
      })
  }, [])

  async function save(submit: boolean) {
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/devlogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          projectId: projectId || null,
          images: images.map((image) => ({
            key: image.key,
            filename: image.filename,
          })),
          submit,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save devlog')
      }

      const devlog = await response.json()
      router.push(`/portal/devlogs/${devlog.id}`)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to save devlog')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card stack">
      <Link href="/portal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Dashboard
      </Link>
      <div>
        <p style={{ color: 'var(--red)', fontWeight: 800, letterSpacing: '0.08em', margin: 0 }}>NEW DEVLOG</p>
        <h1 style={{ marginBottom: '0.5rem' }}>Write down the work while it still feels alive.</h1>
      </div>

      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Devlog title" className="field" />
      <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="field">
        <option value="">No linked project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title || 'Untitled project'}
          </option>
        ))}
      </select>
      <MarkdownEditor value={body} onChange={setBody} minHeight={320} />
      <ImageUpload
        images={images}
        onUpload={(image) => setImages((current) => [...current, image])}
        onRemove={(key) => setImages((current) => current.filter((image) => image.key !== key))}
      />

      {error && <p style={{ color: 'var(--red)', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => save(false)} className="btn-outline" disabled={saving}>
          Save Draft
        </button>
        <button type="button" onClick={() => save(true)} className="btn-primary" disabled={saving}>
          Submit for Review
        </button>
      </div>
    </div>
  )
}
