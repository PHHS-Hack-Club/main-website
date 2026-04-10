'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MailRequestActions({
  requestId,
  localPart,
  memberId: _memberId,
}: {
  requestId: string
  localPart: string
  memberId: string
}) {
  const router = useRouter()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState('')

  async function handleApprove() {
    setLoading('approve')
    setError('')
    try {
      const res = await fetch(`/api/admin/mail/requests/${requestId}/approve`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to approve.')
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault()
    setLoading('reject')
    setError('')
    try {
      const res = await fetch(`/api/admin/mail/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to reject.')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {error && <p style={{ color: '#ec3750', margin: 0, fontSize: '0.85rem' }}>{error}</p>}

      {!rejecting ? (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            style={{ fontSize: '0.82rem', minHeight: 32, padding: '0.35rem 0.8rem' }}
            disabled={loading !== null}
            onClick={handleApprove}
          >
            {loading === 'approve' ? 'Approving…' : `Approve ${localPart}@phhshack.club`}
          </button>
          <button
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.35rem 0.8rem', color: 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer' }}
            disabled={loading !== null}
            onClick={() => setRejecting(true)}
          >
            Reject
          </button>
        </div>
      ) : (
        <form onSubmit={handleReject} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--dim)', marginBottom: '0.25rem' }}>
              Reason (shown to member)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional reason…"
              style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.85rem' }}
              autoFocus
            />
          </div>
          <button
            type="submit"
            style={{ background: '#ec3750', border: 'none', borderRadius: 6, padding: '0.45rem 0.9rem', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            disabled={loading !== null}
          >
            {loading === 'reject' ? 'Rejecting…' : 'Confirm reject'}
          </button>
          <button
            type="button"
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.45rem 0.8rem', color: 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer' }}
            onClick={() => setRejecting(false)}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  )
}
