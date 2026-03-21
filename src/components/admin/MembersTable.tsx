'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface MemberRow {
  id: string
  username: string
  name: string
  email: string
  role: 'PRESIDENT' | 'VP' | 'MEMBER'
  createdAt: string
}

export default function MembersTable({ members }: { members: MemberRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(members)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function updateRow(id: string, field: keyof Omit<MemberRow, 'id' | 'createdAt'>, value: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row
        }

        return {
          ...row,
          [field]: value,
        }
      })
    )
  }

  async function saveRow(id: string) {
    const row = rows.find((item) => item.id === id)

    if (!row) {
      return
    }

    setSavingId(id)
    setError('')

    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: row.username,
          name: row.name,
          email: row.email,
          role: row.role,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update member')
      }

      router.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to update member')
    } finally {
      setSavingId(null)
    }
  }

  async function deleteRow(id: string) {
    if (!window.confirm('Delete this member?')) {
      return
    }

    setSavingId(id)
    setError('')

    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete member')
      }

      setRows((current) => current.filter((row) => row.id !== id))
      router.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to delete member')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="stack" style={{ gap: '0.75rem' }}>
      {error && <p style={{ color: 'var(--red)', margin: 0 }}>{error}</p>}
      <div className="table-wrap surface" style={{ padding: '0.5rem 1rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input value={row.username} onChange={(event) => updateRow(row.id, 'username', event.target.value)} className="field" placeholder="alexradu" />
                </td>
                <td>
                  <input value={row.name} onChange={(event) => updateRow(row.id, 'name', event.target.value)} className="field" />
                </td>
                <td>
                  <input value={row.email} onChange={(event) => updateRow(row.id, 'email', event.target.value)} className="field" />
                </td>
                <td>
                  <select value={row.role} onChange={(event) => updateRow(row.id, 'role', event.target.value)} className="field">
                    <option value="PRESIDENT">PRESIDENT</option>
                    <option value="VP">VP</option>
                    <option value="MEMBER">MEMBER</option>
                  </select>
                </td>
                <td style={{ color: 'var(--muted)' }}>{new Date(row.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn-primary" style={{ minHeight: 36, padding: '0.55rem 0.9rem' }} disabled={savingId === row.id} onClick={() => saveRow(row.id)}>
                      Save
                    </button>
                    <button type="button" className="btn-ghost" style={{ minHeight: 36, padding: '0.55rem 0.9rem', color: 'var(--red)' }} disabled={savingId === row.id} onClick={() => deleteRow(row.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
