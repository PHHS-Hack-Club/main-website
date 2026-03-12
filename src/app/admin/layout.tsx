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
          <Link href="/admin/verification">Verification</Link>
          <Link href="/admin/members">Members</Link>
          <Link href="/admin/submissions">Submissions</Link>
          <Link href="/portal" style={{ color: 'var(--muted)' }}>
            Back to portal
          </Link>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
