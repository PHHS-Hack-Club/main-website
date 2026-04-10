import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import MailboxActions from './MailboxActions'

export default async function AdminMailboxesPage() {
  const mailboxes = await prisma.mailbox.findMany({
    where: { status: { not: 'DELETED' } },
    orderBy: { createdAt: 'desc' },
    include: { member: { select: { name: true, email: true } } },
  })

  const statusColor: Record<string, string> = {
    ACTIVE: '#4ade80',
    SUSPENDED: '#ec3750',
    PROVISIONED_AWAITING_PASSWORD: '#f7c948',
    PENDING_DELETION: '#f97316',
  }

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
    PROVISIONED_AWAITING_PASSWORD: 'Awaiting setup',
    PENDING_DELETION: 'Pending deletion',
  }

  return (
    <div className="stack">
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Admin
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.35rem' }}>Mailboxes</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Manage active <span style={{ fontFamily: 'var(--font-mono)' }}>@phhshack.club</span> mailboxes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/admin/mail/requests" className="btn-outline" style={{ fontSize: '0.85rem' }}>
            Requests
          </Link>
          <Link href="/admin/mail/audit" className="btn-outline" style={{ fontSize: '0.85rem' }}>
            Audit log
          </Link>
        </div>
      </div>

      {mailboxes.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', margin: 0 }}>No active mailboxes.</p>
        </div>
      ) : (
        <div className="stack">
          {mailboxes.map((mb) => (
            <article key={mb.id} className="card stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: '#ec3750' }}>
                      {mb.localPart}@{mb.domain}
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                      color: statusColor[mb.status] ?? 'var(--dim)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[mb.status] ?? 'var(--dim)', display: 'inline-block' }} />
                      {statusLabel[mb.status] ?? mb.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--muted)', margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                    {mb.member.name} · {mb.member.email}
                  </p>
                  <p style={{ color: 'var(--dim)', margin: '0.35rem 0 0', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    created {mb.createdAt.toLocaleDateString()}
                    {mb.deleteAfter && ` · deletes ${mb.deleteAfter.toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <MailboxActions
                mailboxId={mb.id}
                localPart={mb.localPart}
                status={mb.status}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
