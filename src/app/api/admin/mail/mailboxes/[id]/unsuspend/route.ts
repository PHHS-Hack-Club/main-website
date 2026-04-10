import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { issueSetupToken } from '@/lib/mail-tokens'
import { writeMailAudit } from '@/lib/mail-audit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const mailbox = await prisma.mailbox.findUnique({ where: { id } })
  if (!mailbox) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (mailbox.status !== 'SUSPENDED') return NextResponse.json({ error: 'Mailbox is not suspended' }, { status: 409 })

  const tokenResult = await issueSetupToken({
    memberId: mailbox.memberId,
    mailboxId: id,
    issuedByMemberId: session.memberId,
  })

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3007'
  const setupUrl = `${baseUrl}/portal/mail/setup?token=${tokenResult.rawToken}`

  await prisma.$transaction(async (tx) => {
    await tx.mailbox.update({
      where: { id },
      data: { status: 'PROVISIONED_AWAITING_PASSWORD', suspendedAt: null },
    })
    await writeMailAudit(
      {
        action: 'MAILBOX_UNSUSPENDED',
        actorMemberId: session.memberId,
        subjectMemberId: mailbox.memberId,
        mailboxId: id,
      },
      tx,
    )
  })

  // Email the member the setup link
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const email = await import('@/lib/email') as any
    if (typeof email.sendMailRequestApprovedToMember === 'function') {
      const member = await prisma.member.findUnique({ where: { id: mailbox.memberId } })
      if (member) {
        await email.sendMailRequestApprovedToMember({
          memberEmail: member.email,
          memberName: member.name,
          fullAddress: `${mailbox.localPart}@${mailbox.domain}`,
          setupUrl,
        })
      }
    }
  } catch (e) {
    console.error('[mail] unsuspend email failed:', e instanceof Error ? e.message : 'unknown')
  }

  return NextResponse.json({ ok: true, setupUrl, expiresAt: tokenResult.expiresAt })
}
