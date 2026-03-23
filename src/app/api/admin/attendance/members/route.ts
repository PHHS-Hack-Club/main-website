import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [members, totalMeetings, records] = await Promise.all([
    prisma.member.findMany({
      select: { id: true, name: true, role: true, username: true },
      orderBy: { name: 'asc' },
    }),
    prisma.meeting.count(),
    prisma.attendanceRecord.groupBy({
      by: ['memberId'],
      _count: { id: true },
    }),
  ])

  const countByMember = new Map(
    records.map((r) => [r.memberId, r._count.id])
  )

  return NextResponse.json(
    members.map((m) => {
      const attended = countByMember.get(m.id) ?? 0
      return {
        ...m,
        attended,
        totalMeetings,
        rate: totalMeetings > 0 ? Math.round((attended / totalMeetings) * 100) : 0,
      }
    })
  )
}
