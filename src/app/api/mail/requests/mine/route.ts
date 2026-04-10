import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeMailAudit } from '@/lib/mail-audit'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const request = await prisma.emailRequest.findFirst({
    where: { memberId: session.memberId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ request })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.emailRequest.findFirst({
    where: { memberId: session.memberId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  if (!existing) {
    return NextResponse.json({ error: 'No pending request found' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.emailRequest.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' },
    })
    await writeMailAudit(
      {
        action: 'EMAIL_REQUEST_CANCELLED',
        actorMemberId: session.memberId,
        subjectMemberId: session.memberId,
        emailRequestId: existing.id,
      },
      tx,
    )
  })

  return NextResponse.json({ ok: true })
}
