'use client'

import { useEffect, useState } from 'react'
import MarkdownEditor from '@/components/MarkdownEditor'
import MarkdownPreview from '@/components/MarkdownPreview'

interface Meeting {
  id: string
  title: string
  date: string
  notes: string | null
  summary: string | null
  materials: string | null
  summaryReminderSentAt: string | null
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

function dateKey(iso: string) {
  return new Date(iso).toISOString().split('T')[0]
}

export default function MeetingManager() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editMaterials, setEditMaterials] = useState('')
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

  function startEdit(meeting: Meeting) {
    setEditingId(meeting.id)
    setEditTitle(meeting.title)
    setEditDate(toDateInput(meeting.date))
    setEditNotes(meeting.notes ?? '')
    setEditSummary(meeting.summary ?? '')
    setEditMaterials(meeting.materials ?? '')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          date: editDate,
          notes: editNotes,
          summary: editSummary,
          materials: editMaterials,
        }),
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

  const todayKey = new Date().toISOString().split('T')[0]
  const upcoming = meetings.filter((meeting) => dateKey(meeting.date) >= todayKey)
  const past = meetings.filter((meeting) => dateKey(meeting.date) < todayKey)

  return (
    <div className="stack">
      {error && <p style={{ color: 'var(--red)', margin: 0 }}>{error}</p>}

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
            placeholder="Notes before the meeting (optional)"
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
          {upcoming.length > 0 && (
            <section className="stack">
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
                UPCOMING
              </p>
              {upcoming.map((meeting) => (
                <MeetingRow
                  key={meeting.id}
                  meeting={meeting}
                  isEditing={editingId === meeting.id}
                  editTitle={editTitle}
                  editDate={editDate}
                  editNotes={editNotes}
                  editSummary={editSummary}
                  editMaterials={editMaterials}
                  saving={saving}
                  deleting={deletingId === meeting.id}
                  onEdit={() => startEdit(meeting)}
                  onSave={() => saveEdit(meeting.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => deleteMeeting(meeting.id)}
                  setEditTitle={setEditTitle}
                  setEditDate={setEditDate}
                  setEditNotes={setEditNotes}
                  setEditSummary={setEditSummary}
                  setEditMaterials={setEditMaterials}
                />
              ))}
            </section>
          )}

          {past.length > 0 && (
            <section className="stack">
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700 }}>
                PAST
              </p>
              {past.map((meeting) => (
                <MeetingRow
                  key={meeting.id}
                  meeting={meeting}
                  isEditing={editingId === meeting.id}
                  editTitle={editTitle}
                  editDate={editDate}
                  editNotes={editNotes}
                  editSummary={editSummary}
                  editMaterials={editMaterials}
                  saving={saving}
                  deleting={deletingId === meeting.id}
                  onEdit={() => startEdit(meeting)}
                  onSave={() => saveEdit(meeting.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => deleteMeeting(meeting.id)}
                  setEditTitle={setEditTitle}
                  setEditDate={setEditDate}
                  setEditNotes={setEditNotes}
                  setEditSummary={setEditSummary}
                  setEditMaterials={setEditMaterials}
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
  editSummary,
  editMaterials,
  saving,
  deleting,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  setEditTitle,
  setEditDate,
  setEditNotes,
  setEditSummary,
  setEditMaterials,
}: {
  meeting: Meeting
  isEditing: boolean
  editTitle: string
  editDate: string
  editNotes: string
  editSummary: string
  editMaterials: string
  saving: boolean
  deleting: boolean
  onEdit: () => void
  onSave: () => void
  onCancelEdit: () => void
  onDelete: () => void
  setEditTitle: (value: string) => void
  setEditDate: (value: string) => void
  setEditNotes: (value: string) => void
  setEditSummary: (value: string) => void
  setEditMaterials: (value: string) => void
}) {
  const todayKey = new Date().toISOString().split('T')[0]
  const isPast = dateKey(meeting.date) < todayKey
  const summaryMissing = !meeting.summary || !meeting.summary.trim()

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
          placeholder="Notes before the meeting (optional)"
          style={{ resize: 'vertical' }}
        />

        <div className="stack" style={{ gap: '0.45rem' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            SUMMARY
          </p>
          <MarkdownEditor
            value={editSummary}
            onChange={setEditSummary}
            minHeight={180}
          />
        </div>

        <div className="stack" style={{ gap: '0.45rem' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            MATERIALS / LINKS
          </p>
          <MarkdownEditor
            value={editMaterials}
            onChange={setEditMaterials}
            minHeight={140}
          />
        </div>

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
      <div style={{ flex: 1, minWidth: 280 }}>
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

        {isPast && summaryMissing && (
          <p style={{ margin: '0.5rem 0 0', color: 'var(--orange)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            Summary missing{meeting.summaryReminderSentAt ? ' · reminder sent' : ''}
          </p>
        )}

        {isPast && meeting.summary && (
          <div style={{ marginTop: '0.85rem' }}>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
              SUMMARY
            </p>
            <MarkdownPreview source={meeting.summary} fallback="No summary yet." />
          </div>
        )}

        {isPast && meeting.materials && (
          <div style={{ marginTop: '0.85rem' }}>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
              MATERIALS / LINKS
            </p>
            <MarkdownPreview source={meeting.materials} fallback="No materials yet." />
          </div>
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
