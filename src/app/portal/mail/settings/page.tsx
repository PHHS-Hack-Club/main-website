'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MailSettingsPage() {
  const router = useRouter()
  const [stepUpReady, setStepUpReady] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [syncPassword, setSyncPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [syncError, setSyncError] = useState('')
  const [syncDone, setSyncDone] = useState(false)
  const [done, setDone] = useState(false)

  // Check if step-up proof cookie is present by probing the change endpoint
  useEffect(() => {
    fetch('/api/auth/step-up/issue', { method: 'POST' })
      .then((res) => setStepUpReady(res.ok))
      .catch(() => setStepUpReady(false))
  }, [])

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
      const res = await fetch('/api/mail/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      })
      if (res.ok) {
        setDone(true)
      } else {
        const body = await res.json().catch(() => ({}))
        if (res.status === 403 || body.error?.includes('step')) {
          router.push('/portal/reauth?return=/portal/mail/settings')
          return
        }
        setError(body.error || 'Failed to change password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSync(e: React.FormEvent) {
    e.preventDefault()
    setSyncing(true)
    setSyncError('')
    try {
      const res = await fetch('/api/mail/sso/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: syncPassword }),
      })
      if (res.ok) {
        setSyncDone(true)
        setSyncPassword('')
      } else {
        const body = await res.json().catch(() => ({}))
        if (res.status === 403 || body.error?.includes('step')) {
          router.push('/portal/reauth?return=/portal/mail/settings')
          return
        }
        setSyncError(body.error || 'Failed to enable webmail SSO.')
      }
    } finally {
      setSyncing(false)
    }
  }

  if (done) {
    return (
      <div className="stack">
        <h1>Password changed</h1>
        <div className="card">
          <p style={{ color: 'var(--muted)', margin: '0 0 0.75rem' }}>
            Your club email password has been updated.
          </p>
          <Link href="/portal/mail" className="btn-primary" style={{ fontSize: '0.88rem' }}>
            Back to mail →
          </Link>
        </div>
      </div>
    )
  }

  if (stepUpReady === null) {
    return (
      <div className="stack">
        <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          Verifying session…
        </p>
      </div>
    )
  }

  return (
    <div className="stack">
      <div>
        <p style={{ color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 0.35rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
          {'// MAIL SETTINGS'}
        </p>
        <h1 style={{ marginBottom: '0.35rem' }}>Change password</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Update the password for your <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>@phhshack.club</span> mailbox.
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

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !password || !confirm}
          >
            {submitting ? 'Changing…' : 'Change password →'}
          </button>
          <Link href="/portal/mail" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Cancel
          </Link>
        </div>
      </form>

      <form onSubmit={handleSync} className="card stack" style={{ gap: '1rem' }}>
        <div>
          <p style={{ margin: '0 0 0.35rem', color: 'var(--fg)', fontSize: '0.95rem', fontWeight: 700 }}>
            Enable webmail SSO without changing your password
          </p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.85rem' }}>
            Enter your current mailbox password once and the portal will store an encrypted copy so the PHHS site can sign you into SnappyMail automatically.
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Current mailbox password
          </label>
          <input
            type="password"
            value={syncPassword}
            onChange={(e) => setSyncPassword(e.target.value)}
            required
            placeholder="Enter your current mailbox password"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {syncError && (
          <p style={{ color: '#ec3750', margin: 0, fontSize: '0.88rem' }}>{syncError}</p>
        )}

        {syncDone && (
          <p style={{ color: '#4ade80', margin: 0, fontSize: '0.88rem' }}>
            Webmail SSO is enabled for this mailbox.
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="submit"
            className="btn-outline"
            disabled={syncing || !syncPassword}
          >
            {syncing ? 'Enabling…' : 'Enable webmail SSO'}
          </button>
        </div>
      </form>

      <p style={{ color: 'var(--dim)', fontSize: '0.78rem', margin: 0 }}>
        Rate limited to 5 changes per hour. You&apos;ll receive a confirmation email after the change.
      </p>
    </div>
  )
}
