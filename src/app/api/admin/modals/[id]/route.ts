import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  // enabling a modal disables all others first
  if (body.enabled === true) {
    await prisma.siteModal.updateMany({
      where: { id: { not: id } },
      data: { enabled: false },
    })
  }

  const modal = await prisma.siteModal.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.heading !== undefined && { heading: body.heading }),
      ...(body.body !== undefined && { body: body.body }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
    },
  })

  return NextResponse.json(modal)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  await prisma.siteModal.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
