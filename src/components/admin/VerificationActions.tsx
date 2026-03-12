'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function VerificationActions({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState<'approve' | 'deny' | null>(null)
  const [error, setError] = useState('')

  async function update(action: 'approve' | 'deny') {
    setSaving(action)
    setError('')

    try {
      const response = await fetch(`/api/admin/verification/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Request failed')
      }

      router.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Request failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn-primary" style={{ minHeight: 36, padding: '0.55rem 0.9rem' }} disabled={saving !== null} onClick={() => update('approve')}>
          {saving === 'approve' ? 'Approving...' : 'Approve'}
        </button>
        <button type="button" className="btn-ghost" style={{ minHeight: 36, padding: '0.55rem 0.9rem', color: 'var(--red)' }} disabled={saving !== null} onClick={() => update('deny')}>
          {saving === 'deny' ? 'Denying...' : 'Deny'}
        </button>
      </div>
      {error && <span style={{ color: 'var(--red)', fontSize: '0.82rem' }}>{error}</span>}
    </div>
  )
}
