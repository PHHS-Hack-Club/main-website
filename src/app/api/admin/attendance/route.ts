import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/attendance?date=2026-03-19
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const dateParam = request.nextUrl.searchParams.get('date')
  const date = dateParam
    ? new Date(dateParam + 'T00:00:00Z')
    : new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')

  const [members, records] = await Promise.all([
    prisma.member.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    }),
    prisma.attendanceRecord.findMany({
      where: { date },
      select: { memberId: true },
    }),
  ])

  const presentIds = new Set(records.map((r) => r.memberId))

  return NextResponse.json({
    date: date.toISOString().split('T')[0],
    members: members.map((m) => ({
      ...m,
      present: presentIds.has(m.id),
    })),
  })
}

// POST /api/admin/attendance — toggle a member's attendance
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { memberId, date: dateStr, present } = body

  if (!memberId || !dateStr) {
    return NextResponse.json({ error: 'memberId and date are required' }, { status: 400 })
  }

  const date = new Date(dateStr + 'T00:00:00Z')

  if (present) {
    await prisma.attendanceRecord.upsert({
      where: { memberId_date: { memberId, date } },
      create: { memberId, date },
      update: {},
    })
  } else {
    await prisma.attendanceRecord.deleteMany({
      where: { memberId, date },
    })
  }

  return NextResponse.json({ success: true })
}
