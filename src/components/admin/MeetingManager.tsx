'use client'

import { useState, useEffect } from 'react'

interface Meeting {
  id: string
  title: string
  date: string
  notes: string | null
  attendanceCount: number
  totalMembers: number
}

const fmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

function toDateInput(iso: string) {
  return new Date(iso).toISOString().split('T')[0]
}

export default function MeetingManager() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // create form
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/meetings')
      if (!res.ok) throw new Error('Failed to load meetings')
      setMeetings(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading meetings')
    } finally {
      setLoading(false)
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/admin/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, notes }),
      })
      if (!res.ok) throw new Error('Failed to create meeting')
      setTitle('')
      setDate(new Date().toISOString().split('T')[0])
      setNotes('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creating meeting')
    } finally {
      setCreating(false)
    }
  }

  function startEdit(m: Meeting) {
    setEditingId(m.id)
    setEditTitle(m.title)
    setEditDate(toDateInput(m.date))
    setEditNotes(m.notes ?? '')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, date: editDate, notes: editNotes }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setEditingId(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMeeting(id: string) {
    if (!confirm('Delete this meeting? Attendance records for this date are kept.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/meetings/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setMeetings((prev) => prev.filter((m) => m.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error deleting')
    } finally {
      setDeletingId(null)
    }
  }

  const upcoming = meetings.filter((m) => new Date(m.date) >= new Date(new Date().toDateString()))
  const past = meetings.filter((m) => new Date(m.date) < new Date(new Date().toDateString()))

  return (
    <div className="stack">
      {error && <p style={{ color: 'var(--red)', margin: 0 }}>{error}</p>}

      {/* Create form */}
      <section className="card stack">
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Schedule a Meeting</h2>
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              className="field"
              placeholder="Meeting title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ flex: 1, minWidth: 200 }}
            />
            <input
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{ width: 180 }}
            />
          </div>
          <textarea
            className="field"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ resize: 'vertical' }}
          />
          <div>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Scheduling…' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : (
        <>
          {/* Upcoming meetings */}
          {upcoming.length > 0 && (
            <section className="stack">
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
                UPCOMING
              </p>
              {upcoming.map((m) => (
                <MeetingRow
                  key={m.id}
                  meeting={m}
                  isEditing={editingId === m.id}
                  editTitle={editTitle}
                  editDate={editDate}
                  editNotes={editNotes}
                  saving={saving}
                  deleting={deletingId === m.id}
                  onEdit={() => startEdit(m)}
                  onSave={() => saveEdit(m.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => deleteMeeting(m.id)}
                  setEditTitle={setEditTitle}
                  setEditDate={setEditDate}
                  setEditNotes={setEditNotes}
                />
              ))}
            </section>
          )}

          {/* Past meetings */}
          {past.length > 0 && (
            <section className="stack">
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
                PAST
              </p>
              {past.map((m) => (
                <MeetingRow
                  key={m.id}
                  meeting={m}
                  isEditing={editingId === m.id}
                  editTitle={editTitle}
                  editDate={editDate}
                  editNotes={editNotes}
                  saving={saving}
                  deleting={deletingId === m.id}
                  onEdit={() => startEdit(m)}
                  onSave={() => saveEdit(m.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => deleteMeeting(m.id)}
                  setEditTitle={setEditTitle}
                  setEditDate={setEditDate}
                  setEditNotes={setEditNotes}
                />
              ))}
            </section>
          )}

          {meetings.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No meetings scheduled yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MeetingRow({
  meeting,
  isEditing,
  editTitle,
  editDate,
  editNotes,
  saving,
  deleting,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  setEditTitle,
  setEditDate,
  setEditNotes,
}: {
  meeting: Meeting
  isEditing: boolean
  editTitle: string
  editDate: string
  editNotes: string
  saving: boolean
  deleting: boolean
  onEdit: () => void
  onSave: () => void
  onCancelEdit: () => void
  onDelete: () => void
  setEditTitle: (v: string) => void
  setEditDate: (v: string) => void
  setEditNotes: (v: string) => void
}) {
  const isPast = new Date(meeting.date) < new Date(new Date().toDateString())

  if (isEditing) {
    return (
      <div className="card stack">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="field"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <input
            type="date"
            className="field"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            style={{ width: 180 }}
          />
        </div>
        <textarea
          className="field"
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          rows={2}
          placeholder="Notes (optional)"
          style={{ resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn-ghost" onClick={onCancelEdit}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div>
        <p style={{ margin: '0 0 0.25rem', fontWeight: 800, fontSize: '1rem' }}>{meeting.title}</p>
        <p style={{ margin: '0 0 0.25rem', color: 'var(--muted)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
          {fmt.format(new Date(meeting.date))}
        </p>
        {meeting.notes && (
          <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            {meeting.notes}
          </p>
        )}
        {isPast && (
          <p style={{ margin: '0.5rem 0 0', color: 'var(--dim)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            {meeting.attendanceCount} / {meeting.totalMembers} attended
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button className="btn-ghost" style={{ minHeight: 34, padding: '0.4rem 0.75rem', fontSize: '0.82rem' }} onClick={onEdit}>
          Edit
        </button>
        <button
          className="btn-ghost"
          style={{ minHeight: 34, padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: 'var(--red)' }}
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
