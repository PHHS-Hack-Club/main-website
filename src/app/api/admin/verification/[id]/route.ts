import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { action } = await request.json()
  const verification = await prisma.verificationRequest.findUnique({
    where: { id },
  })

  if (!verification) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (action === 'approve') {
    const existingMember = await prisma.member.findUnique({
      where: { hackClubSub: verification.hackClubSub },
    })

    if (!existingMember) {
      await prisma.member.create({
        data: {
          hackClubSub: verification.hackClubSub,
          email: verification.email,
          name: verification.name,
          role: 'MEMBER',
        },
      })
    }

    await prisma.verificationRequest.update({
      where: { id: verification.id },
      data: { status: 'APPROVED' },
    })
  } else if (action === 'deny') {
    await prisma.verificationRequest.update({
      where: { id: verification.id },
      data: { status: 'DENIED' },
    })
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
