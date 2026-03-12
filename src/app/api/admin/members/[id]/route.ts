import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const member = await prisma.member.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
    },
  })

  return NextResponse.json(member)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  if (session.memberId === id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  await prisma.member.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
