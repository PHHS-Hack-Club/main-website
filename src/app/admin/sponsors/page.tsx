import SponsorManager from '@/components/admin/SponsorManager'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'

export default async function AdminSponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return (
    <div className="stack">
      <div>
        <p style={{ margin: '0 0 0.4rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {'// SPONSORS'}
        </p>
        <h1 style={{ margin: 0, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Sponsors</h1>
        <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0' }}>
          Manage sponsor cards for the public sponsors page.
        </p>
      </div>

      <SponsorManager
        initialSponsors={sponsors.map((sponsor) => ({
          ...sponsor,
          logoUrl: getFileUrl(sponsor.logoKey),
        }))}
      />
    </div>
  )
}
