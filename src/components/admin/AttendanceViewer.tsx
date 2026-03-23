'use client'

import { useState, useEffect } from 'react'

interface MeetingRow {
  id: string
  title: string
  date: string
  notes: string | null
  attendanceCount: number
  totalMembers: number
}

interface MemberRow {
  id: string
  name: string
  role: 'PRESIDENT' | 'VP' | 'MEMBER'
  username: string | null
  attended: number
  totalMeetings: number
  rate: number
}

interface AttendanceMember {
  id: string
  name: string
  role: 'PRESIDENT' | 'VP' | 'MEMBER'
  present: boolean
}

const fmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function AttendanceViewer() {
  const [tab, setTab] = useState<'meetings' | 'members'>('meetings')
  const [meetings, setMeetings] = useState<MeetingRow[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loadingMeetings, setLoadingMeetings] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null)
  const [attendanceByMeeting, setAttendanceByMeeting] = useState<Record<string, AttendanceMember[]>>({})
  const [loadingAttendance, setLoadingAttendance] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/meetings')
      .then((r) => r.json())
      .then(setMeetings)
      .catch(() => setError('Failed to load meetings'))
      .finally(() => setLoadingMeetings(false))
  }, [])

  useEffect(() => {
    if (tab !== 'members' || members.length > 0) return
    setLoadingMembers(true)
    fetch('/api/admin/attendance/members')
      .then((r) => r.json())
      .then(setMembers)
      .catch(() => setError('Failed to load member stats'))
      .finally(() => setLoadingMembers(false))
  }, [tab, members.length])

  async function toggleExpand(meeting: MeetingRow) {
    if (expandedMeetingId === meeting.id) {
      setExpandedMeetingId(null)
      return
    }

    setExpandedMeetingId(meeting.id)

    if (attendanceByMeeting[meeting.id]) return

    const dateStr = new Date(meeting.date).toISOString().split('T')[0]
    setLoadingAttendance(meeting.id)
    try {
      const res = await fetch(`/api/admin/attendance?date=${dateStr}`)
      const data = await res.json()
      setAttendanceByMeeting((prev) => ({ ...prev, [meeting.id]: data.members }))
    } catch {
      setError('Failed to load attendance for this meeting')
    } finally {
      setLoadingAttendance(null)
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.45rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    border: 'none',
    background: active ? 'var(--red)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
  })

  const rateColor = (rate: number) => {
    if (rate >= 75) return 'var(--green, #33d17a)'
    if (rate >= 50) return 'var(--orange)'
    return 'var(--red)'
  }

  return (
    <div className="stack">
      {error && <p style={{ color: 'var(--red)', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--raised)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
        <button style={tabStyle(tab === 'meetings')} onClick={() => setTab('meetings')}>By Meeting</button>
        <button style={tabStyle(tab === 'members')} onClick={() => setTab('members')}>By Member</button>
      </div>

      {tab === 'meetings' && (
        <>
          {loadingMeetings ? (
            <p style={{ color: 'var(--muted)' }}>Loading…</p>
          ) : meetings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No meetings yet. Schedule one from the Meetings page.</p>
            </div>
          ) : (
            <div className="stack">
              {meetings.map((m) => {
                const isPast = new Date(m.date) < new Date(new Date().toDateString())
                const isExpanded = expandedMeetingId === m.id
                const attendance = attendanceByMeeting[m.id]

                return (
                  <div key={m.id} className="card stack" style={{ gap: '0.75rem' }}>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', cursor: isPast ? 'pointer' : 'default' }}
                      onClick={() => isPast && toggleExpand(m)}
                    >
                      <div>
                        <p style={{ margin: '0 0 0.2rem', fontWeight: 800 }}>{m.title}</p>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                          {fmt.format(new Date(m.date))}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isPast ? (
                          <>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                              {m.attendanceCount}
                              <span style={{ color: 'var(--dim)', fontWeight: 400 }}> / {m.totalMembers}</span>
                            </span>
                            <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                              {isExpanded ? '▲ collapse' : '▼ details'}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--orange)', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            UPCOMING
                          </span>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        {loadingAttendance === m.id ? (
                          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.85rem' }}>Loading…</p>
                        ) : attendance ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {attendance.filter((a) => a.present).map((a) => (
                              <span
                                key={a.id}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 'var(--radius-pill)',
                                  background: 'rgba(51,209,122,0.1)',
                                  border: '1px solid rgba(51,209,122,0.25)',
                                  color: 'var(--green, #33d17a)',
                                  fontWeight: 600,
                                }}
                              >
                                {a.name}
                              </span>
                            ))}
                            {attendance.filter((a) => !a.present).map((a) => (
                              <span
                                key={a.id}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 'var(--radius-pill)',
                                  background: 'var(--raised)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--dim)',
                                  fontWeight: 600,
                                }}
                              >
                                {a.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'members' && (
        <>
          {loadingMembers ? (
            <p style={{ color: 'var(--muted)' }}>Loading…</p>
          ) : members.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No members found.</p>
            </div>
          ) : (
            <div className="table-wrap surface" style={{ padding: '0.5rem 1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Attended</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .sort((a, b) => b.rate - a.rate)
                    .map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                        <td style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{m.role}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {m.attended} / {m.totalMeetings}
                        </td>
                        <td>
                          <span style={{ color: rateColor(m.rate), fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                            {m.totalMeetings > 0 ? `${m.rate}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
