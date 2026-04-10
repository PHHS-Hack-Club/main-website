'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function MailSetupInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="stack">
        <h1>Invalid link</h1>
        <div className="card">
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            This setup link is missing or invalid. Contact an admin for a new one.
          </p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/mail/password/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => router.push('/portal/mail'), 2000)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to set password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="stack">
        <h1>Password set!</h1>
        <div className="card">
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Your club email is ready. Redirecting to your mail dashboard…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <div>
        <p style={{ color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 0.35rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
          {'// CLUB EMAIL SETUP'}
        </p>
        <h1 style={{ marginBottom: '0.35rem' }}>Set your password</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Choose a strong password for your <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>@phhshack.club</span> mailbox.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card stack" style={{ gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
            autoFocus
            placeholder="At least 12 characters"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Confirm password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Repeat password"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <p style={{ color: '#ec3750', margin: 0, fontSize: '0.88rem' }}>{error}</p>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || !password || !confirm}
          style={{ alignSelf: 'flex-start' }}
        >
          {submitting ? 'Setting password…' : 'Set password →'}
        </button>
      </form>

      <p style={{ color: 'var(--dim)', fontSize: '0.78rem', margin: 0 }}>
        This link expires 24 hours after it was issued. If it has expired, contact an admin.
      </p>
    </div>
  )
}

export default function MailSetupPage() {
  return (
    <Suspense fallback={<div className="stack"><p style={{ color: 'var(--dim)' }}>Loading…</p></div>}>
      <MailSetupInner />
    </Suspense>
  )
}
