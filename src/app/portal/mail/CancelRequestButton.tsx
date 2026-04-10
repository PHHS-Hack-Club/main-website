'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelRequestButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('Cancel your email request?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/mail/requests/mine', { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      style={{
        alignSelf: 'flex-start',
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '0.35rem 0.8rem',
        color: 'var(--muted)',
        fontSize: '0.82rem',
        cursor: 'pointer',
      }}
    >
      {loading ? 'Cancelling…' : 'Cancel request'}
    </button>
  )
}
