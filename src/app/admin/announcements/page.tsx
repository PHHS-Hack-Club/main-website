import { prisma } from '@/lib/prisma'
import AnnouncementManager from '@/components/admin/AnnouncementManager'

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const memberCount = await prisma.member.count({
    where: { schoolEmail: { not: null } },
  })

  const serialized = announcements.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    emailedAt: a.emailedAt?.toISOString() ?? null,
  }))

  return <AnnouncementManager initialAnnouncements={serialized} memberEmailCount={memberCount} />
}