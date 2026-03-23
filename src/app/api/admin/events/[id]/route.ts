import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const { title, date, description, location } = await request.json()

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(title ? { title: title.trim() } : {}),
      ...(date ? { date: new Date(date) } : {}),
      description: description?.trim() || null,
      location: location?.trim() || null,
    },
  })

  return NextResponse.json({ event })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  await prisma.event.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
