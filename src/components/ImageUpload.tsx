'use client'

import { useRef, useState } from 'react'

export interface UploadedImage {
  key: string
  url: string
  filename: string
}

interface Props {
  images: UploadedImage[]
  onUpload: (image: UploadedImage) => void
  onRemove: (key: string) => void
}

export default function ImageUpload({ images, onUpload, onRemove }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }
      const data = await res.json()
      onUpload({ key: data.key, url: data.url, filename: file.name })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }

    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="stack" style={{ gap: 'var(--space-1)' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Screenshots</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <button
        type="button"
        className="btn-ghost"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{ alignSelf: 'flex-start', gap: '0.4rem' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        {uploading ? 'Uploading…' : 'Add screenshot'}
      </button>

      {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
          {images.map((img) => (
            <div key={img.key} style={{ position: 'relative' }}>
              <img
                src={img.url}
                alt={img.filename}
                style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }}
              />
              <button
                onClick={() => onRemove(img.key)}
                type="button"
                aria-label={`Remove ${img.filename}`}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--red)', color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: '0.75rem', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

