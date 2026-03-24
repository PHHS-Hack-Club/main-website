import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toOptionalText(value: unknown) {
  if (typeof value !== 'string') return null
  return value.trim() ? value : null
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.title !== undefined) {
    const title = toOptionalText(body.title)
    if (!title) {
      return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 })
    }
    data.title = title
  }

  if (body.date !== undefined) {
    const date = typeof body.date === 'string' && body.date.trim() ? body.date : null
    if (!date) {
      return NextResponse.json({ error: 'date cannot be empty' }, { status: 400 })
    }
    data.date = new Date(date)
  }

  if (body.notes !== undefined) {
    data.notes = toOptionalText(body.notes)
  }

  if (body.summary !== undefined) {
    data.summary = toOptionalText(body.summary)
  }

  if (body.materials !== undefined) {
    data.materials = toOptionalText(body.materials)
  }

  const meeting = await prisma.meeting.update({
    where: { id },
    data,
  })

  return NextResponse.json(meeting)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await prisma.meeting.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
