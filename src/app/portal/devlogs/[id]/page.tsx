'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload, { UploadedImage } from '@/components/ImageUpload'
import MarkdownEditor from '@/components/MarkdownEditor'

interface ProjectOption {
  id: string
  title: string
}

interface DevlogData {
  id: string
  title: string
  body: string
  projectId: string | null
  status: string
  images: UploadedImage[]
}

export default function EditDevlogPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [projectId, setProjectId] = useState('')
  const [status, setStatus] = useState('')
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [images, setImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [devlogResponse, projectResponse] = await Promise.all([
          fetch(`/api/devlogs/${params.id}`),
          fetch('/api/devlogs'),
        ])

        if (!devlogResponse.ok || !projectResponse.ok) {
          throw new Error('Failed to load devlog')
        }

        const devlog: DevlogData = await devlogResponse.json()
        const projectOptions: ProjectOption[] = await projectResponse.json()

        setTitle(devlog.title)
        setBody(devlog.body)
        setProjectId(devlog.projectId || '')
        setStatus(devlog.status)
        setImages(devlog.images || [])
        setProjects(projectOptions)
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Failed to load devlog')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  async function save(submit: boolean) {
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/devlogs/${params.id}`, {
        method: 'PUT',
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
        throw new Error('Failed to update devlog')
      }

      router.push('/portal')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to update devlog')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this devlog?')) {
      return
    }

    const response = await fetch(`/api/devlogs/${params.id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      router.push('/portal')
    } else {
      setError('Failed to delete devlog')
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--muted)' }}>Loading devlog...</p>
  }

  return (
    <div className="card stack">
      <Link href="/portal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Dashboard
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: 'var(--red)', fontWeight: 800, letterSpacing: '0.08em', margin: 0 }}>EDIT DEVLOG</p>
          <h1 style={{ marginBottom: '0.5rem' }}>{title || 'Untitled devlog'}</h1>
        </div>
        <span className={`status-pill ${status}`}>{status}</span>
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
        <button type="button" onClick={handleDelete} className="btn-ghost" style={{ color: 'var(--red)', marginLeft: 'auto' }}>
          Delete
        </button>
      </div>
    </div>
  )
}
