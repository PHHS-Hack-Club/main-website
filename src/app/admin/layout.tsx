import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession, isAdmin } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    redirect('/portal')
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-5)' }}>
      <div className="shell-grid">
        <aside className="card stack" style={{ position: 'sticky', top: 88 }}>
          <div>
            <p style={{ color: 'var(--red)', fontWeight: 800, letterSpacing: '0.08em', margin: 0 }}>ADMIN</p>
            <h2 style={{ marginBottom: '0.35rem' }}>Review center</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Verification, roles, and approvals.</p>
          </div>
          <Link href="/admin">Overview</Link>

          <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--dim)' }}>MEMBERS</p>
          <Link href="/admin/members">Members</Link>
          <Link href="/admin/verification">Verification</Link>

          <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--dim)' }}>CONTENT</p>
          <Link href="/admin/submissions">Submissions</Link>
          <Link href="/admin/announcements">Announcements</Link>
          <Link href="/admin/modals">Modals</Link>

          <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--dim)' }}>CLUB</p>
          <Link href="/admin/meetings">Meetings</Link>
          <Link href="/admin/events">Events</Link>
          <Link href="/admin/attendance">Attendance</Link>
          <Link href="/admin/email">Email</Link>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <Link href="/portal" style={{ color: 'var(--muted)' }}>← Portal</Link>
          </div>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
