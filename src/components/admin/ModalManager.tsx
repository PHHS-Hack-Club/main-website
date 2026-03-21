'use client'

import { useState } from 'react'

interface SiteModal {
  id: string
  title: string
  heading: string
  body: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface ModalForm {
  id?: string
  title: string
  heading: string
  body: string
}

const emptyForm = (): ModalForm => ({ title: '', heading: '', body: '' })

export default function ModalManager({ initialModals }: { initialModals: SiteModal[] }) {
  const [modals, setModals] = useState<SiteModal[]>(initialModals)
  const [form, setForm] = useState<ModalForm | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggleEnabled(modal: SiteModal) {
    const next = !modal.enabled
    const res = await fetch(`/api/admin/modals/${modal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    })
    if (!res.ok) return
    const updated = await res.json() as SiteModal
    setModals((prev) =>
      prev.map((m) => (next ? { ...m, enabled: m.id === modal.id } : m.id === modal.id ? updated : m))
    )
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this modal?')) return
    const res = await fetch(`/api/admin/modals/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setModals((prev) => prev.filter((m) => m.id !== id))
    if (form?.id === id) setForm(null)
  }

  async function handleGenerate() {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/modals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json() as { heading?: string; body?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Generation failed')
        return
      }
      setForm((prev) => prev ? { ...prev, heading: data.heading ?? prev.heading, body: data.body ?? prev.body } : prev)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      if (form.id) {
        const res = await fetch(`/api/admin/modals/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, heading: form.heading, body: form.body }),
        })
        if (!res.ok) { setError('Failed to save'); return }
        const updated = await res.json() as SiteModal
        setModals((prev) => prev.map((m) => (m.id === form.id ? { ...m, ...updated } : m)))
      } else {
        const res = await fetch('/api/admin/modals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, heading: form.heading, body: form.body }),
        })
        if (!res.ok) { setError('Failed to create'); return }
        const created = await res.json() as SiteModal
        setModals((prev) => [created, ...prev])
      }
      setForm(null)
      setAiPrompt('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Modals</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Create and manage site-wide announcement modals. Only one can be active at a time.</p>
        </div>
        {!form && (
          <button type="button" className="btn-primary" onClick={() => { setForm(emptyForm()); setAiPrompt('') }}>
            + New modal
          </button>
        )}
      </div>

      {form && (
        <div className="card stack" style={{ borderColor: 'var(--red)' }}>
          <div>
            <p style={{ margin: '0 0 0.35rem', color: 'var(--red)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
              {form.id ? '// EDIT MODAL' : '// NEW MODAL'}
            </p>
            <h3 style={{ margin: 0 }}>{form.id ? 'Edit modal' : 'Create modal'}</h3>
          </div>

          <div className="stack" style={{ gap: '0.65rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                Internal title
              </label>
              <input
                className="field"
                style={{ width: '100%' }}
                placeholder="e.g. Spring meeting announcement"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                Heading
              </label>
              <input
                className="field"
                style={{ width: '100%' }}
                placeholder="Short, punchy headline shown to visitors"
                value={form.heading}
                onChange={(e) => setForm({ ...form, heading: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                Body
              </label>
              <textarea
                className="field"
                style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
                placeholder="Modal body text shown to visitors"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
          </div>

          <div className="card" style={{ background: 'var(--raised)', borderStyle: 'dashed' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              ✦ GENERATE WITH AI
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                className="field"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Describe what this modal should say..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate() }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerate}
                disabled={generating || !aiPrompt.trim()}
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--dim)' }}>
              AI will fill in the heading and body fields above.
            </p>
          </div>

          {error && (
            <p style={{ color: 'var(--red)', margin: 0, fontSize: '0.85rem' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => { setForm(null); setAiPrompt(''); setError(null) }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {modals.length === 0 && !form ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>No modals yet. Create one above.</p>
        </div>
      ) : (
        <div className="stack">
          {modals.map((modal) => (
            <div
              key={modal.id}
              className="card"
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                borderColor: modal.enabled ? 'var(--red)' : undefined,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{modal.title}</p>
                  {modal.enabled && (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.5rem',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(236,55,80,0.15)',
                      border: '1px solid rgba(236,55,80,0.4)',
                      color: 'var(--red)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                    }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                {modal.heading && (
                  <p style={{ margin: '0 0 0.2rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    &ldquo;{modal.heading}&rdquo;
                  </p>
                )}
                {modal.body && (
                  <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {modal.body.slice(0, 100)}{modal.body.length > 100 ? '...' : ''}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={modal.enabled ? 'btn-ghost' : 'btn-primary'}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                  onClick={() => handleToggleEnabled(modal)}
                >
                  {modal.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                  onClick={() => { setForm({ id: modal.id, title: modal.title, heading: modal.heading, body: modal.body }); setAiPrompt('') }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', color: 'var(--red)' }}
                  onClick={() => handleDelete(modal.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
