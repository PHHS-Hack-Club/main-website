import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import MailRequestActions from './MailRequestActions'

export default async function AdminMailRequestsPage() {
  const requests = await prisma.emailRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { member: { select: { id: true, name: true, email: true } } },
  })

  const recentlyReviewed = await prisma.emailRequest.findMany({
    where: { status: { in: ['APPROVED', 'REJECTED'] } },
    orderBy: { reviewedAt: 'desc' },
    take: 10,
    include: { member: { select: { name: true } } },
  })

  const statusColor: Record<string, string> = {
    APPROVED: '#4ade80',
    REJECTED: '#ec3750',
  }

  return (
    <div className="stack">
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Admin
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.35rem' }}>Mail Requests</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Approve or reject member requests for <span style={{ fontFamily: 'var(--font-mono)' }}>@phhshack.club</span> addresses.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/admin/mail/mailboxes" className="btn-outline" style={{ fontSize: '0.85rem' }}>
            Mailboxes
          </Link>
          <Link href="/admin/mail/audit" className="btn-outline" style={{ fontSize: '0.85rem' }}>
            Audit log
          </Link>
        </div>
      </div>

      <section className="stack">
        <h2 style={{ margin: 0, fontSize: '1rem' }}>
          Pending
          <span style={{ color: 'var(--dim)', fontWeight: 400, fontSize: '0.85rem', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            {requests.length}
          </span>
        </h2>

        {requests.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--muted)', margin: 0 }}>No pending mail requests.</p>
          </div>
        ) : (
          <div className="stack">
            {requests.map((req) => (
              <article key={req.id} className="card stack">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{req.member.name}</strong>
                    <p style={{ color: 'var(--muted)', margin: '0.15rem 0 0', fontSize: '0.85rem' }}>{req.member.email}</p>
                    <p style={{ color: 'var(--dim)', margin: '0.5rem 0 0', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      Wants: <span style={{ color: '#ec3750' }}>{req.requestedLocalPart}@{req.domain}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <p style={{ color: 'var(--dim)', margin: 0, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {req.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <MailRequestActions requestId={req.id} localPart={req.requestedLocalPart} memberId={req.member.id} />
              </article>
            ))}
          </div>
        )}
      </section>

      {recentlyReviewed.length > 0 && (
        <section className="stack">
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Recently reviewed</h2>
          <div className="stack">
            {recentlyReviewed.map((req) => (
              <div key={req.id} className="card" style={{ opacity: 0.75 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.88rem' }}>{req.member.name}</strong>
                    <span style={{ color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                      {req.requestedLocalPart}@{req.domain}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: statusColor[req.status] ?? 'var(--dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {req.status}
                    </span>
                    <span style={{ color: 'var(--dim)', fontSize: '0.75rem' }}>
                      {req.reviewedAt?.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {req.rejectionReason && (
                  <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.82rem' }}>
                    Reason: {req.rejectionReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
