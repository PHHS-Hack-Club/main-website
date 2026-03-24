import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toOptionalText(value: unknown) {
  if (typeof value !== 'string') return null
  return value.trim() ? value : null
}

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const meetings = await prisma.meeting.findMany({
    orderBy: { date: 'desc' },
  })

  const attendanceCounts = await prisma.attendanceRecord.groupBy({
    by: ['date'],
    _count: { id: true },
    where: { date: { in: meetings.map((m) => m.date) } },
  })

  const countByDate = new Map(
    attendanceCounts.map((a) => [a.date.toISOString(), a._count.id])
  )

  const totalMembers = await prisma.member.count()

  return NextResponse.json(
    meetings.map((m) => ({
      ...m,
      attendanceCount: countByDate.get(m.date.toISOString()) ?? 0,
      totalMembers,
    }))
  )
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const title = toOptionalText(body.title)
  const date = typeof body.date === 'string' && body.date.trim() ? body.date : null

  if (!title || !date) {
    return NextResponse.json({ error: 'title and date are required' }, { status: 400 })
  }

  const meeting = await prisma.meeting.create({
    data: {
      title,
      date: new Date(date),
      notes: toOptionalText(body.notes),
      summary: toOptionalText(body.summary),
      materials: toOptionalText(body.materials),
    },
  })

  return NextResponse.json(meeting, { status: 201 })
}
