'use client'

import { useRef, useState } from 'react'

export interface UploadedSponsorLogo {
  key: string
  url: string
  filename: string
}

export default function SponsorLogoUpload({
  value,
  onChange,
}: {
  value: UploadedSponsorLogo | null
  onChange: (image: UploadedSponsorLogo | null) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
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
      onChange({
        key: data.key,
        url: data.url,
        filename: file.name,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
        Logo *
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {value ? (
        <div
          style={{
            display: 'flex',
            gap: '0.8rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--raised)',
              borderRadius: '50%',
              border: '1px solid var(--border)',
              padding: '0.7rem',
            }}
          >
            <img
              src={value.url}
              alt={value.filename}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div className="stack" style={{ gap: '0.45rem' }}>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.78rem' }}>
              {value.filename}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                {uploading ? 'Uploading…' : 'Replace'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => onChange(null)}
                disabled={uploading}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--red)' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn-ghost"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ alignSelf: 'flex-start', gap: '0.4rem' }}
        >
          {uploading ? 'Uploading…' : 'Upload logo'}
        </button>
      )}

      {error && <p style={{ margin: 0, color: 'var(--red)', fontSize: '0.82rem' }}>{error}</p>}
    </div>
  )
}
