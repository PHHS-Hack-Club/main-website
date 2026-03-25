'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import SponsorLogoUpload, { type UploadedSponsorLogo } from '@/components/admin/SponsorLogoUpload'

interface Sponsor {
  id: string
  title: string
  linkUrl: string
  logoKey: string
  logoUrl: string
  description: string | null
  tier: string | null
  sortOrder: number
  active: boolean
}

function logoStateFromSponsor(sponsor: Sponsor): UploadedSponsorLogo {
  return {
    key: sponsor.logoKey,
    url: sponsor.logoUrl,
    filename: sponsor.title,
  }
}

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '0.3rem',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--muted)',
  fontFamily: 'var(--font-mono)',
}

export default function SponsorManager({ initialSponsors }: { initialSponsors: Sponsor[] }) {
  const [sponsors, setSponsors] = useState(initialSponsors)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [logo, setLogo] = useState<UploadedSponsorLogo | null>(null)
  const [description, setDescription] = useState('')
  const [tier, setTier] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [active, setActive] = useState(true)

  function resetForm() {
    setTitle('')
    setLinkUrl('')
    setLogo(null)
    setDescription('')
    setTier('')
    setSortOrder('0')
    setActive(true)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  function startCreate() {
    resetForm()
    setShowForm(true)
  }

  function startEdit(sponsor: Sponsor) {
    setEditingId(sponsor.id)
    setTitle(sponsor.title)
    setLinkUrl(sponsor.linkUrl)
    setLogo(logoStateFromSponsor(sponsor))
    setDescription(sponsor.description ?? '')
    setTier(sponsor.tier ?? '')
    setSortOrder(String(sponsor.sortOrder))
    setActive(sponsor.active)
    setShowForm(true)
    setError('')
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!logo?.key) {
        throw new Error('Sponsor logo is required')
      }

      const payload = {
        title,
        linkUrl,
        logoKey: logo.key,
        description,
        tier,
        sortOrder: Number(sortOrder),
        active,
      }

      if (editingId) {
        const res = await fetch(`/api/admin/sponsors/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to save sponsor')

        setSponsors((prev) =>
          prev
            .map((sponsor) => (sponsor.id === editingId ? data.sponsor : sponsor))
            .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
        )
      } else {
        const res = await fetch('/api/admin/sponsors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create sponsor')

        setSponsors((prev) =>
          [...prev, data.sponsor].sort(
            (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
          )
        )
      }

      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sponsor')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this sponsor?')) return

    const res = await fetch(`/api/admin/sponsors/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSponsors((prev) => prev.filter((sponsor) => sponsor.id !== id))
    }
  }

  return (
    <div className="stack">
      {!showForm && (
        <div>
          <button type="button" className="btn-primary" onClick={startCreate}>
            + New sponsor
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="card stack">
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
            {editingId ? 'Edit sponsor' : 'New sponsor'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
            </div>

            <div>
              <label style={labelStyle}>Tier</label>
              <input className="field" value={tier} onChange={(e) => setTier(e.target.value)} placeholder="Gold" />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Sponsor link *</label>
              <input
                className="field"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                required
                placeholder="https://example.com"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <SponsorLogoUpload value={logo} onChange={setLogo} />
            </div>

            <div>
              <label style={labelStyle}>Sort order</label>
              <input
                type="number"
                className="field"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                paddingTop: '1.65rem',
                color: 'var(--muted)',
                fontWeight: 600,
              }}
            >
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Show on public page
            </label>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea
                className="field"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
                placeholder="What they sponsor, why they matter, how they support the club..."
              />
            </div>
          </div>

          {error && <p style={{ color: 'var(--red)', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create sponsor'}
            </button>
            <button type="button" className="btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {sponsors.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            No sponsors yet. Create one to have it appear on the public sponsors page.
          </p>
        </div>
      )}

      {sponsors.length > 0 && (
        <section className="stack" style={{ gap: '0.5rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
            ALL SPONSORS
          </p>

          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                padding: '0.9rem 1.1rem',
                opacity: sponsor.active ? 1 : 0.55,
              }}
            >
              <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', flex: 1, minWidth: 260 }}>
                <img
                  src={sponsor.logoUrl}
                  alt={sponsor.title}
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: 'contain',
                    borderRadius: '50%',
                    background: 'var(--raised)',
                    border: '1px solid var(--border)',
                    padding: '0.45rem',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p style={{ margin: '0 0 0.15rem', fontWeight: 700, fontSize: '0.95rem' }}>
                    {sponsor.title}
                    {sponsor.tier && (
                      <span style={{ color: 'var(--orange)', marginLeft: '0.45rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                        {sponsor.tier.toUpperCase()}
                      </span>
                    )}
                  </p>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                    order {sponsor.sortOrder} · {sponsor.active ? 'public' : 'hidden'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--dim)', fontSize: '0.82rem' }}>
                    {sponsor.description || sponsor.linkUrl}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                  onClick={() => startEdit(sponsor)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', color: 'var(--red)' }}
                  onClick={() => handleDelete(sponsor.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
