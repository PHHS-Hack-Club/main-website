'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Candidate {
  localPart: string
  available: boolean
  reason?: string
}

export default function MailRequestFormClient({ memberName }: { memberName: string }) {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mail/options')
      if (res.ok) {
        const data = await res.json()
        setCandidates(data.candidates ?? [])
        const first = (data.candidates as Candidate[]).find((c) => c.available)
        if (first) setSelected(first.localPart)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/mail/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localPart: selected }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to submit request.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', margin: 0 }}>
          Loading available addresses…
        </p>
      </div>
    )
  }

  const available = candidates.filter((c) => c.available)

  if (available.length === 0) {
    return (
      <div className="card">
        <p style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}>
          No addresses based on your name (<strong>{memberName}</strong>) are currently available.
        </p>
        <p style={{ color: 'var(--dim)', margin: 0, fontSize: '0.85rem' }}>
          Contact an admin to request a custom address.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card stack" style={{ gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Choose your address
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {candidates.map((c) => (
            <label
              key={c.localPart}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.9rem',
                borderRadius: 8,
                border: `1px solid ${selected === c.localPart ? 'rgba(236,55,80,0.5)' : 'var(--border)'}`,
                background: selected === c.localPart ? 'rgba(236,55,80,0.06)' : 'var(--raised)',
                cursor: c.available ? 'pointer' : 'not-allowed',
                opacity: c.available ? 1 : 0.45,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <input
                type="radio"
                name="localPart"
                value={c.localPart}
                checked={selected === c.localPart}
                disabled={!c.available}
                onChange={() => setSelected(c.localPart)}
                style={{ accentColor: '#ec3750', flexShrink: 0 }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: c.available ? '#ec3750' : 'var(--dim)', flex: 1 }}>
                {c.localPart}@phhshack.club
              </span>
              {!c.available && (
                <span style={{ fontSize: '0.72rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)' }}>
                  {c.reason ?? 'taken'}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p style={{ color: '#ec3750', margin: 0, fontSize: '0.88rem' }}>{error}</p>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={!selected || submitting}
        style={{ alignSelf: 'flex-start', fontSize: '0.88rem' }}
      >
        {submitting ? 'Submitting…' : 'Request this address →'}
      </button>

      <p style={{ color: 'var(--dim)', margin: 0, fontSize: '0.78rem' }}>
        Requests are reviewed by a club admin. You&apos;ll get an email when it&apos;s approved or rejected.
      </p>
    </form>
  )
}
