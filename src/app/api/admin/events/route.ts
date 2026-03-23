import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const events = await prisma.event.findMany({ orderBy: { date: 'asc' } })
  return NextResponse.json({ events })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { title, date, description, location } = await request.json()
  if (!title?.trim() || !date) {
    return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
  }

  const event = await prisma.event.create({
    data: {
      title: title.trim(),
      date: new Date(date),
      description: description?.trim() || null,
      location: location?.trim() || null,
    },
  })

  return NextResponse.json({ event }, { status: 201 })
}
