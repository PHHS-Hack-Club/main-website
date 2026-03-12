import Link from 'next/link'
import VerificationActions from '@/components/admin/VerificationActions'
import { prisma } from '@/lib/prisma'

export default async function VerificationPage() {
  const requests = await prisma.verificationRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="stack">
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Admin
      </Link>
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Verification</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Approve members after they sign in through Hack Club for the first time.</p>
      </div>

      {requests.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', margin: 0 }}>No pending verification requests.</p>
        </div>
      ) : (
        <div className="stack">
          {requests.map((request) => (
            <article key={request.id} className="card stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: '0.4rem' }}>{request.name}</h2>
                  <p style={{ color: 'var(--muted)', margin: 0 }}>{request.email}</p>
                </div>
                <VerificationActions requestId={request.id} />
              </div>
              <p style={{ color: 'var(--muted)', margin: 0 }}>Requested {request.createdAt.toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
