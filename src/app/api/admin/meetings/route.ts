import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const meetings = await prisma.meeting.findMany({
    orderBy: { date: 'desc' },
  })

  // Pull attendance counts for all meeting dates in one query
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

  const { title, date, notes } = await req.json()
  if (!title || !date) {
    return NextResponse.json({ error: 'title and date are required' }, { status: 400 })
  }

  const meeting = await prisma.meeting.create({
    data: { title, date: new Date(date), notes: notes || null },
  })

  return NextResponse.json(meeting, { status: 201 })
}
