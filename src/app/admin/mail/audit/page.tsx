import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 50

export default async function AdminMailAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1))
  const skip = (page - 1) * PAGE_SIZE

  const [entries, total] = await Promise.all([
    prisma.mailAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        actor: { select: { name: true } },
        subject: { select: { name: true } },
        mailbox: { select: { localPart: true, domain: true } },
      },
    }),
    prisma.mailAuditLog.count(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const actionColor: Record<string, string> = {
    MAILBOX_PROVISIONED: '#4ade80',
    MAILBOX_DELETED: '#ec3750',
    MAILBOX_SUSPENDED: '#f97316',
    MAILBOX_UNSUSPENDED: '#4ade80',
    MAILBOX_DELETION_SCHEDULED: '#f7c948',
    PASSWORD_SETUP_COMPLETED: '#4ade80',
    PASSWORD_CHANGED: '#60a5fa',
    PASSWORD_RESET_BY_ADMIN: '#f97316',
    PASSWORD_SETUP_TOKEN_ISSUED: '#60a5fa',
    EMAIL_REQUEST_SUBMITTED: 'var(--muted)',
    EMAIL_REQUEST_APPROVED: '#4ade80',
    EMAIL_REQUEST_REJECTED: '#ec3750',
    EMAIL_REQUEST_CANCELLED: 'var(--dim)',
  }

  return (
    <div className="stack">
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Admin
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.35rem' }}>Mail Audit Log</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            {total.toLocaleString()} entries · page {page} of {totalPages}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/admin/mail/requests" className="btn-outline" style={{ fontSize: '0.85rem' }}>
            Requests
          </Link>
          <Link href="/admin/mail/mailboxes" className="btn-outline" style={{ fontSize: '0.85rem' }}>
            Mailboxes
          </Link>
        </div>
      </div>

      <div className="stack">
        {entries.map((entry) => (
          <div key={entry.id} className="card" style={{ padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: actionColor[entry.action] ?? 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {entry.action.replace(/_/g, ' ')}
                  </span>
                  {entry.mailbox && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#ec3750' }}>
                      {entry.mailbox.localPart}@{entry.mailbox.domain}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {entry.actor && <span>by {entry.actor.name}</span>}
                  {entry.subject && entry.subject.name !== entry.actor?.name && (
                    <span>· for {entry.subject.name}</span>
                  )}
                </div>
                {entry.metadata && typeof entry.metadata === 'object' && Object.keys(entry.metadata as object).length > 0 && (
                  <p style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--dim)', wordBreak: 'break-all' }}>
                    {JSON.stringify(entry.metadata)}
                  </p>
                )}
              </div>
              <span style={{ fontSize: '0.73rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {entry.createdAt.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {page > 1 && (
            <Link href={`/admin/mail/audit?page=${page - 1}`} className="btn-outline" style={{ fontSize: '0.82rem' }}>
              ← Prev
            </Link>
          )}
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem', alignSelf: 'center' }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/mail/audit?page=${page + 1}`} className="btn-outline" style={{ fontSize: '0.82rem' }}>
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
