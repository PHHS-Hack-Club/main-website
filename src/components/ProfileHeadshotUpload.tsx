'use client'

import { useRef, useState } from 'react'

export default function ProfileHeadshotUpload({
  currentUrl,
  name,
}: {
  currentUrl: string | null
  name: string
}) {
  const [imageUrl, setImageUrl] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile-headshot', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Upload failed')
        return
      }

      const data = await res.json()
      setImageUrl(data.url)
    } catch {
      alert('Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    setUploading(true)
    try {
      await fetch('/api/profile-headshot', { method: 'DELETE' })
      setImageUrl(null)
    } catch {
      alert('Failed to remove')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: '100%',
          maxWidth: 320,
          aspectRatio: '16 / 9',
          borderRadius: '22px',
          overflow: 'hidden',
          cursor: uploading ? 'wait' : 'pointer',
          border: '1px solid var(--border)',
          background: imageUrl
            ? 'none'
            : 'linear-gradient(135deg, rgba(236,55,80,0.14) 0%, rgba(255,140,55,0.08) 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title='Change headshot'
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={`${name} headshot`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(7,7,10,0.02) 0%, rgba(7,7,10,0.5) 100%)',
              }}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ margin: '0 0 0.35rem', fontWeight: 700 }}>Add headshot</p>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem' }}>
              Wide image used behind your profile icon.
            </p>
          </div>
        )}

        {uploading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '0.72rem',
            }}
          >
            Uploading...
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        onChange={handleUpload}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
        <button
          type='button'
          className='btn-ghost'
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
        >
          {imageUrl ? 'Change headshot' : 'Upload headshot'}
        </button>
        {imageUrl && (
          <button
            type='button'
            className='btn-ghost'
            onClick={handleRemove}
            disabled={uploading}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', color: 'var(--red)' }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
