import { prisma } from '@/lib/prisma'
import AdminEmailClient from '@/components/admin/AdminEmailClient'

export default async function AdminEmailPage() {
  const [members, mailingEntries] = await Promise.all([
    prisma.member.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.mailingListEntry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        member: { select: { id: true, name: true, email: true } },
      },
    }),
  ])

  return (
    <div className="stack">
      <div>
        <p style={{ margin: '0 0 0.4rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {'// EMAIL'}
        </p>
        <h1 style={{ margin: 0, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Email Suite</h1>
        <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0' }}>
          Compose emails, manage the mailing list.
        </p>
      </div>
      <AdminEmailClient members={members} initialEntries={mailingEntries} />
    </div>
  )
}
