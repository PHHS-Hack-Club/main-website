import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeMailAudit } from '@/lib/mail-audit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const reason = body.reason ?? 'No reason provided'

  const emailRequest = await prisma.emailRequest.findUnique({
    where: { id },
    include: { member: { select: { email: true, name: true } } },
  })
  if (!emailRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (emailRequest.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request is not pending' }, { status: 409 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.emailRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedByMemberId: session.memberId,
        reviewedAt: new Date(),
      },
    })
    await writeMailAudit(
      {
        action: 'EMAIL_REQUEST_REJECTED',
        actorMemberId: session.memberId,
        subjectMemberId: emailRequest.memberId,
        emailRequestId: id,
        metadata: { reason },
      },
      tx,
    )
  })

  // Fire-and-forget rejection email
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const email = await import('@/lib/email') as any
    if (typeof email.sendMailRequestRejectedToMember === 'function') {
      await email.sendMailRequestRejectedToMember({
        memberEmail: emailRequest.member.email,
        memberName: emailRequest.member.name,
        localPart: emailRequest.requestedLocalPart,
        reason,
      })
    }
  } catch (e) {
    console.error('[mail] rejection email failed:', e instanceof Error ? e.message : 'unknown')
  }

  return NextResponse.json({ ok: true })
}
