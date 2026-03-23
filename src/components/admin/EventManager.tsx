'use client'

import { useState } from 'react'

interface ClubEvent {
  id: string
  title: string
  date: string | Date
  description: string | null
  location: string | null
}

const dateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

function toInputDate(d: string | Date) {
  return new Date(d).toISOString().split('T')[0]
}

export default function EventManager({ initialEvents }: { initialEvents: ClubEvent[] }) {
  const [events, setEvents] = useState(initialEvents)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  function startCreate() {
    setEditingId(null)
    setTitle('')
    setDate('')
    setDescription('')
    setLocation('')
    setShowForm(true)
  }

  function startEdit(ev: ClubEvent) {
    setEditingId(ev.id)
    setTitle(ev.title)
    setDate(toInputDate(ev.date))
    setDescription(ev.description ?? '')
    setLocation(ev.location ?? '')
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/events/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, date, description, location }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        const { event } = await res.json()
        setEvents((prev) => prev.map((ev) => (ev.id === editingId ? event : ev)))
      } else {
        const res = await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, date, description, location }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        const { event } = await res.json()
        setEvents((prev) => [...prev, event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
      }
      cancelForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return
    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    if (res.ok) setEvents((prev) => prev.filter((ev) => ev.id !== id))
  }

  const now = new Date()
  const upcoming = events.filter((ev) => new Date(ev.date) >= now)
  const past = events.filter((ev) => new Date(ev.date) < now)

  return (
    <div className="stack">
      {!showForm && (
        <div>
          <button type="button" className="btn-primary" onClick={startCreate}>
            + New event
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="card stack">
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
            {editingId ? 'Edit event' : 'New event'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Title *</label>
              <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Date *</label>
              <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Location</label>
              <input className="field" placeholder="Room 255" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Description</label>
              <textarea className="field" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>

          {error && <p style={{ color: 'var(--red)', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create event'}
            </button>
            <button type="button" className="btn-ghost" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}

      {events.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>No events yet. Create one to have it appear on the public events page.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="stack" style={{ gap: '0.5rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>UPCOMING</p>
          {upcoming.map((ev) => <EventRow key={ev.id} ev={ev} onEdit={startEdit} onDelete={handleDelete} />)}
        </section>
      )}

      {past.length > 0 && (
        <section className="stack" style={{ gap: '0.5rem' }}>
          <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>PAST</p>
          {past.map((ev) => <EventRow key={ev.id} ev={ev} onEdit={startEdit} onDelete={handleDelete} dim />)}
        </section>
      )}
    </div>
  )
}

function EventRow({ ev, onEdit, onDelete, dim }: {
  ev: ClubEvent
  onEdit: (ev: ClubEvent) => void
  onDelete: (id: string) => void
  dim?: boolean
}) {
  const dateFmt2 = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 1.1rem', opacity: dim ? 0.6 : 1 }}>
      <div>
        <p style={{ margin: '0 0 0.15rem', fontWeight: 700, fontSize: '0.95rem' }}>{ev.title}</p>
        <p style={{ margin: 0, color: 'var(--orange)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          {dateFmt2.format(new Date(ev.date))}
          {ev.location && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {ev.location}</span>}
        </p>
        {ev.description && (
          <p style={{ margin: '0.25rem 0 0', color: 'var(--dim)', fontSize: '0.82rem' }}>{ev.description}</p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button type="button" className="btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => onEdit(ev)}>Edit</button>
        <button type="button" className="btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', color: 'var(--red)' }} onClick={() => onDelete(ev.id)}>Delete</button>
      </div>
    </div>
  )
}
