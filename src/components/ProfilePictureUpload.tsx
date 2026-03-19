'use client'

import { useState, useRef } from 'react'

export default function ProfilePictureUpload({
  currentUrl,
  name,
}: {
  currentUrl: string | null
  name: string
}) {
  const [imageUrl, setImageUrl] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile-picture', { method: 'POST', body: form })
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
      await fetch('/api/profile-picture', { method: 'DELETE' })
      setImageUrl(null)
    } catch {
      alert('Failed to remove')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          overflow: 'hidden',
          background: imageUrl ? 'none' : 'var(--raised)',
          border: '2px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          position: 'relative',
        }}
        title="Change profile picture"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {initials}
          </span>
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
              fontSize: '0.7rem',
            }}
          >
            ...
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          fontSize: '0.72rem',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          padding: '0.2rem 0.4rem',
        }}
      >
        {imageUrl ? 'change photo' : 'add photo'}
      </button>
      {imageUrl && (
        <button
          onClick={handleRemove}
          disabled={uploading}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--red)',
            fontSize: '0.68rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            padding: 0,
          }}
        >
          remove
        </button>
      )}
    </div>
  )
}
