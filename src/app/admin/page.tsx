import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function AdminPage() {
  const [memberCount, pendingVerifications, pendingProjects, pendingDevlogs] = await Promise.all([
    prisma.member.count(),
    prisma.verificationRequest.count({
      where: { status: 'PENDING' },
    }),
    prisma.project.count({
      where: { status: 'PENDING' },
    }),
    prisma.devlog.count({
      where: { status: 'PENDING' },
    }),
  ])

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Admin Overview</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Keep approvals moving so the portal does not turn into a draft graveyard.</p>
      </div>

      <div className="grid-cards">
        <Link href="/admin/verification" className="card card-interactive">
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>Pending Verifications</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{pendingVerifications}</p>
        </Link>
        <Link href="/admin/submissions" className="card card-interactive">
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>Pending Projects</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{pendingProjects}</p>
        </Link>
        <Link href="/admin/submissions" className="card card-interactive">
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>Pending Devlogs</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{pendingDevlogs}</p>
        </Link>
        <Link href="/admin/members" className="card card-interactive">
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>Members</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{memberCount}</p>
        </Link>
      </div>
    </div>
  )
}
