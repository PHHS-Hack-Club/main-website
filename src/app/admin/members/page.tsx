import Link from 'next/link'
import MembersTable from '@/components/admin/MembersTable'
import { prisma } from '@/lib/prisma'

export default async function MembersPage() {
  const members = await prisma.member.findMany({
    orderBy: [{ createdAt: 'asc' }],
  })

  return (
    <div className="stack">
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Admin
      </Link>
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Members</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Edit names, email addresses, and roles for active club members.</p>
      </div>
      <MembersTable
        members={members.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          createdAt: member.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
