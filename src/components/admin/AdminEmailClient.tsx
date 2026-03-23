'use client'

import { useState } from 'react'

interface Member {
  id: string
  name: string
  email: string
}

interface MailingEntry {
  id: string
  name: string
  schoolEmail: string
  createdAt: Date | string
  member: { id: string; name: string; email: string } | null
}

export default function AdminEmailClient({
  members,
  initialEntries,
}: {
  members: Member[]
  initialEntries: MailingEntry[]
}) {
  const [tab, setTab] = useState<'compose' | 'list'>('compose')
  const [entries, setEntries] = useState(initialEntries)

  // Compose state
  const [to, setTo] = useState('all_members')
  const [subject, setSubject] = useState('')
  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; total: number; errors: string[] } | null>(null)
  const [sendError, setSendError] = useState('')

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setSendError('')
    setResult(null)

    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject: subject.trim(),
          heading: heading.trim(),
          body: body.trim(),
          ctaLabel: ctaLabel.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error || 'Failed to send')
      } else {
        setResult(data)
      }
    } catch {
      setSendError('Network error')
    } finally {
      setSending(false)
    }
  }

  async function deleteEntry(id: string) {
    const res = await fetch('/api/admin/mailing-list', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const merged = entries.filter((e) => e.member)
  const unmerged = entries.filter((e) => !e.member)

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    color: active ? 'var(--text)' : 'var(--dim)',
    paddingBottom: '0.5rem',
    borderBottom: active ? '2px solid var(--red)' : '2px solid transparent',
    transition: 'color 120ms ease',
  })

  return (
    <div className="stack">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        <button type="button" style={tabStyle(tab === 'compose')} onClick={() => setTab('compose')}>
          COMPOSE
        </button>
        <button type="button" style={tabStyle(tab === 'list')} onClick={() => setTab('list')}>
          MAILING LIST ({entries.length})
        </button>
      </div>

      {tab === 'compose' && (
        <form onSubmit={handleSend} className="stack">
          {/* To */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              To
            </label>
            <select
              className="field"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            >
              <optgroup label="Bulk">
                <option value="all_members">All members ({members.length})</option>
                <option value="all_mailing_list">All mailing list (members + unmerged signups)</option>
              </optgroup>
              <optgroup label="Individual members">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.email}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Subject line
            </label>
            <input
              type="text"
              className="field"
              placeholder="Next meeting this Friday!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Heading */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Email heading
            </label>
            <input
              type="text"
              className="field"
              placeholder="See you Friday at 3PM"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              required
            />
          </div>

          {/* Body */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Body text
            </label>
            <textarea
              className="field"
              rows={5}
              placeholder="We're meeting in room 214 this week. Bring your laptop!"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Optional CTA */}
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600, userSelect: 'none', marginBottom: '0.5rem' }}>
              Optional: custom button
            </summary>
            <div className="stack" style={{ gap: '0.65rem', paddingTop: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  Button label
                </label>
                <input
                  type="text"
                  className="field"
                  placeholder="View details"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  Button URL
                </label>
                <input
                  type="url"
                  className="field"
                  placeholder="https://phhshack.club/meetings"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
            </div>
          </details>

          {sendError && <p style={{ color: 'var(--red)', margin: 0 }}>{sendError}</p>}

          {result && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: result.errors.length ? 'rgba(255,140,55,0.08)' : 'rgba(80,220,120,0.08)',
                border: `1px solid ${result.errors.length ? 'rgba(255,140,55,0.25)' : 'rgba(80,220,120,0.25)'}`,
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, color: result.errors.length ? 'var(--orange)' : '#50dc78' }}>
                Sent {result.sent} / {result.total}
              </p>
              {result.errors.length > 0 && (
                <ul style={{ margin: '0.4rem 0 0', padding: '0 0 0 1.1rem', color: 'var(--orange)', fontSize: '0.82rem' }}>
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="btn-primary"
              disabled={sending}
              style={{ minWidth: 140 }}
            >
              {sending ? 'Sending…' : 'Send email'}
            </button>
          </div>
        </form>
      )}

      {tab === 'list' && (
        <div className="stack">
          {/* Stats */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: '0 0 auto', padding: '0.75rem 1.25rem', minWidth: 120 }}>
              <p style={{ margin: '0 0 0.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--text)' }}>{entries.length}</p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>total signups</p>
            </div>
            <div className="card" style={{ flex: '0 0 auto', padding: '0.75rem 1.25rem', minWidth: 120 }}>
              <p style={{ margin: '0 0 0.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: '#50dc78' }}>{merged.length}</p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>merged</p>
            </div>
            <div className="card" style={{ flex: '0 0 auto', padding: '0.75rem 1.25rem', minWidth: 120 }}>
              <p style={{ margin: '0 0 0.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--orange)' }}>{unmerged.length}</p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>unmerged</p>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No signups yet. Share /kiosk with your VP!</p>
            </div>
          ) : (
            <div className="table-wrap surface" style={{ padding: '0.5rem 1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>School Email</th>
                    <th>Status</th>
                    <th>Member</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ fontWeight: 600 }}>{entry.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--muted)' }}>{entry.schoolEmail}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.55rem',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            background: entry.member ? 'rgba(80,220,120,0.1)' : 'rgba(255,140,55,0.1)',
                            border: `1px solid ${entry.member ? 'rgba(80,220,120,0.3)' : 'rgba(255,140,55,0.3)'}`,
                            color: entry.member ? '#50dc78' : 'var(--orange)',
                          }}
                        >
                          {entry.member ? 'MERGED' : 'PENDING'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                        {entry.member ? entry.member.name : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--dim)' }}
                          onClick={() => deleteEntry(entry.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
