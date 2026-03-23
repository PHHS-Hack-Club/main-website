'use client'

import { useState } from 'react'

export default function SchoolEmailBanner() {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/profile/school-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolEmail: email }),
    })

    const data = await res.json() as { error?: string }

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    setDone(true)
  }

  return (
    <div className="card animate-up" style={{
      borderColor: 'rgba(236,55,80,0.35)',
      background: 'radial-gradient(ellipse 80% 100% at 0% 50%, rgba(236,55,80,0.06) 0%, var(--surface) 60%)',
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
            // ONE MORE THING
          </p>
          <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1rem' }}>Add your school email</p>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.875rem' }}>
            Get club announcements sent directly to your Pascack email.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start', flex: 1, minWidth: 260 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              className="field"
              style={{ width: '100%' }}
              type="email"
              placeholder="yourname@pascack.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p style={{ margin: '0.3rem 0 0', color: 'var(--red)', fontSize: '0.8rem' }}>{error}</p>}
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}
