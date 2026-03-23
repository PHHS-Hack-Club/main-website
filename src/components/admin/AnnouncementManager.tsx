'use client'

import { useState, useCallback } from 'react'

interface Announcement {
  id: string
  title: string
  body: string
  published: boolean
  emailedAt: string | null
  createdAt: string
  updatedAt: string
}

interface Form {
  id?: string
  title: string
  body: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

const emptyForm = (): Form => ({ title: '', body: '' })
let toastCounter = 0

export default function AnnouncementManager({
  initialAnnouncements,
  memberEmailCount,
}: {
  initialAnnouncements: Announcement[]
  memberEmailCount: number
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmSend, setConfirmSend] = useState<string | null>(null)

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  async function handleTogglePublished(a: Announcement) {
    const res = await fetch(`/api/admin/announcements/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !a.published }),
    })
    if (!res.ok) { addToast('Failed to update', 'error'); return }
    const updated = await res.json() as Announcement
    setAnnouncements((prev) => prev.map((x) => (x.id === a.id ? { ...x, ...updated } : x)))
    addToast(updated.published ? 'Published' : 'Unpublished', 'success')
  }

  async function handleDelete(id: string) {
    setConfirmDelete(null)
    const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
    if (!res.ok) { addToast('Failed to delete', 'error'); return }
    setAnnouncements((prev) => prev.filter((x) => x.id !== id))
    if (form?.id === id) setForm(null)
    addToast('Announcement deleted', 'success')
  }

  async function handleSend(a: Announcement) {
    setConfirmSend(null)
    setSending(a.id)
    const res = await fetch(`/api/admin/announcements/${a.id}/send`, { method: 'POST' })
    const data = await res.json() as { sent?: number; error?: string }
    setSending(null)
    if (!res.ok) { addToast(data.error ?? 'Failed to send', 'error'); return }
    setAnnouncements((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, emailedAt: new Date().toISOString() } : x))
    )
    addToast(`Sent to ${data.sent} member${data.sent !== 1 ? 's' : ''}`, 'success')
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      if (form.id) {
        const res = await fetch(`/api/admin/announcements/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, body: form.body }),
        })
        if (!res.ok) { setError('Failed to save'); return }
        const updated = await res.json() as Announcement
        setAnnouncements((prev) => prev.map((x) => (x.id === form.id ? { ...x, ...updated } : x)))
        addToast('Saved', 'success')
      } else {
        const res = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, body: form.body }),
        })
        if (!res.ok) { setError('Failed to create'); return }
        const created = await res.json() as Announcement
        setAnnouncements((prev) => [created, ...prev])
        addToast('Announcement created', 'success')
      }
      setForm(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      {/* toasts */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999, display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: t.type === 'success' ? 'rgba(30,30,44,0.97)' : 'rgba(44,20,24,0.97)',
              border: `1px solid ${t.type === 'success' ? 'rgba(100,220,130,0.35)' : 'rgba(236,55,80,0.45)'}`,
              color: t.type === 'success' ? '#7de8a0' : 'var(--red)',
              borderRadius: 'var(--radius)',
              padding: '0.6rem 1rem',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              animation: 'animate-up 0.15s ease',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {t.type === 'success' ? '✓ ' : '✗ '}{t.message}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Announcements</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Published announcements appear on the home page.{' '}
            <span style={{ color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              {memberEmailCount} member{memberEmailCount !== 1 ? 's' : ''} have school emails.
            </span>
          </p>
        </div>
        {!form && (
          <button type="button" className="btn-primary" onClick={() => setForm(emptyForm())}>
            + New announcement
          </button>
        )}
      </div>

      {form && (
        <div className="card stack" style={{ borderColor: 'var(--red)' }}>
          <div>
            <p style={{ margin: '0 0 0.35rem', color: 'var(--red)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
              {form.id ? '// EDIT ANNOUNCEMENT' : '// NEW ANNOUNCEMENT'}
            </p>
            <h3 style={{ margin: 0 }}>{form.id ? 'Edit' : 'Create'} announcement</h3>
          </div>

          <div className="stack" style={{ gap: '0.65rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                Title
              </label>
              <input
                className="field"
                style={{ width: '100%' }}
                placeholder="e.g. Meeting this Thursday!"
                value={form.title}
                onChange={(e) => { const v = e.target.value; setForm((prev) => prev ? { ...prev, title: v } : prev) }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                Body
              </label>
              <textarea
                className="field"
                style={{ width: '100%', minHeight: 120, resize: 'vertical' }}
                placeholder="What do members need to know?"
                value={form.body}
                onChange={(e) => { const v = e.target.value; setForm((prev) => prev ? { ...prev, body: v } : prev) }}
              />
            </div>
          </div>

          {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: '0.85rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => { setForm(null); setError(null) }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {announcements.length === 0 && !form ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>No announcements yet.</p>
        </div>
      ) : (
        <div className="stack">
          {announcements.map((a) => (
            <div key={a.id} className="card" style={{ borderColor: a.published ? 'var(--red)' : undefined }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{a.title}</p>
                    {a.published && (
                      <span style={{
                        fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-pill)',
                        background: 'rgba(236,55,80,0.15)', border: '1px solid rgba(236,55,80,0.4)',
                        color: 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em',
                      }}>PUBLISHED</span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.35rem', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {a.body.slice(0, 120)}{a.body.length > 120 ? '...' : ''}
                  </p>
                  <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                    {a.emailedAt && ` · emailed ${new Date(a.emailedAt).toLocaleDateString()}`}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={a.published ? 'btn-ghost' : 'btn-primary'}
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    onClick={() => handleTogglePublished(a)}
                  >
                    {a.published ? 'Unpublish' : 'Publish'}
                  </button>

                  {a.published && (
                    confirmSend === a.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Send to {memberEmailCount}?</span>
                        <button type="button" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => handleSend(a)} disabled={sending === a.id}>
                          Yes
                        </button>
                        <button type="button" className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => setConfirmSend(null)}>
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', color: 'var(--orange)' }}
                        onClick={() => setConfirmSend(a.id)}
                        disabled={sending === a.id}
                      >
                        {sending === a.id ? 'Sending...' : `Email (${memberEmailCount})`}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    onClick={() => { setForm({ id: a.id, title: a.title, body: a.body }); setConfirmDelete(null); setConfirmSend(null) }}
                  >
                    Edit
                  </button>

                  {confirmDelete === a.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>Delete?</span>
                      <button type="button" className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: 'var(--red)' }} onClick={() => handleDelete(a.id)}>
                        Yes
                      </button>
                      <button type="button" className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => setConfirmDelete(null)}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', color: 'var(--red)' }}
                      onClick={() => setConfirmDelete(a.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
