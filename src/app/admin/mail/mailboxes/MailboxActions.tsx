'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Action = 'suspend' | 'unsuspend' | 'reset-password' | 'schedule-deletion' | 'delete' | null

export default function MailboxActions({
  mailboxId,
  localPart,
  status,
}: {
  mailboxId: string
  localPart: string
  status: string
}) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<Action>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suspendReason, setSuspendReason] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [graceDays, setGraceDays] = useState('30')

  async function callApi(path: string, body?: object) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/mail/mailboxes/${mailboxId}/${path}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.ok) {
        setActiveAction(null)
        router.refresh()
      } else {
        const b = await res.json().catch(() => ({}))
        setError(b.error || 'Request failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const btnStyle = {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '0.32rem 0.7rem',
    color: 'var(--muted)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {error && <p style={{ color: '#ec3750', margin: 0, fontSize: '0.82rem' }}>{error}</p>}

      {activeAction === null && (
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button style={btnStyle} onClick={() => callApi('reset-password')} disabled={loading}>
            Reset password
          </button>
          {status === 'ACTIVE' && (
            <button style={btnStyle} onClick={() => setActiveAction('suspend')} disabled={loading}>
              Suspend
            </button>
          )}
          {status === 'SUSPENDED' && (
            <button style={btnStyle} onClick={() => callApi('unsuspend')} disabled={loading}>
              Unsuspend
            </button>
          )}
          {status !== 'PENDING_DELETION' && (
            <button style={{ ...btnStyle, color: '#f97316', borderColor: 'rgba(249,115,22,0.3)' }} onClick={() => setActiveAction('schedule-deletion')} disabled={loading}>
              Schedule deletion
            </button>
          )}
          <button style={{ ...btnStyle, color: '#ec3750', borderColor: 'rgba(236,55,80,0.3)' }} onClick={() => setActiveAction('delete')} disabled={loading}>
            Delete now
          </button>
        </div>
      )}

      {activeAction === 'suspend' && (
        <form
          onSubmit={(e) => { e.preventDefault(); callApi('suspend', { reason: suspendReason || undefined }) }}
          style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--dim)', marginBottom: '0.2rem' }}>
              Reason (optional, shown to member)
            </label>
            <input
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Policy violation"
              style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.82rem' }}
              autoFocus
            />
          </div>
          <button type="submit" style={{ ...btnStyle, borderColor: '#ec3750', color: '#ec3750' }} disabled={loading}>
            {loading ? 'Suspending…' : 'Confirm suspend'}
          </button>
          <button type="button" style={btnStyle} onClick={() => setActiveAction(null)}>Cancel</button>
        </form>
      )}

      {activeAction === 'schedule-deletion' && (
        <form
          onSubmit={(e) => { e.preventDefault(); callApi('schedule-deletion', { graceDays: Number(graceDays) }) }}
          style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.73rem', color: 'var(--dim)', marginBottom: '0.2rem' }}>
              Grace period (days)
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={graceDays}
              onChange={(e) => setGraceDays(e.target.value)}
              style={{ width: 80, fontSize: '0.82rem' }}
            />
          </div>
          <button type="submit" style={{ ...btnStyle, borderColor: '#f97316', color: '#f97316' }} disabled={loading}>
            {loading ? 'Scheduling…' : 'Schedule'}
          </button>
          <button type="button" style={btnStyle} onClick={() => setActiveAction(null)}>Cancel</button>
        </form>
      )}

      {activeAction === 'delete' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            fetch(`/api/admin/mail/mailboxes/${mailboxId}/delete?confirm=${encodeURIComponent(localPart)}`, { method: 'POST' })
              .then(async (res) => {
                if (res.ok) { setActiveAction(null); router.refresh() }
                else { const b = await res.json().catch(() => ({})); setError(b.error || 'Failed.') }
              })
              .catch(() => setError('Request failed.'))
          }}
          style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: '0.73rem', color: '#ec3750', marginBottom: '0.2rem', fontWeight: 700 }}>
              Type <span style={{ fontFamily: 'var(--font-mono)' }}>{localPart}</span> to confirm permanent deletion
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={localPart}
              style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.82rem', borderColor: 'rgba(236,55,80,0.4)' }}
              autoFocus
            />
          </div>
          <button
            type="submit"
            style={{ ...btnStyle, borderColor: '#ec3750', color: '#ec3750', fontWeight: 700 }}
            disabled={loading || deleteConfirm !== localPart}
          >
            {loading ? 'Deleting…' : 'Delete permanently'}
          </button>
          <button type="button" style={btnStyle} onClick={() => { setActiveAction(null); setDeleteConfirm('') }}>Cancel</button>
        </form>
      )}
    </div>
  )
}
