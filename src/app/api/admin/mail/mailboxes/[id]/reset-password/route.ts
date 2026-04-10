import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPurelymailClient } from '@/lib/purelymail'
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
  const { searchParams } = new URL(req.url)
  const hard = searchParams.get('hard') === 'true'

  const mailbox = await prisma.mailbox.findUnique({ where: { id } })
  if (!mailbox) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (mailbox.status === 'DELETED') return NextResponse.json({ error: 'Mailbox is deleted' }, { status: 409 })

  if (hard) {
    // Immediately lock out the member by rotating to a random password
    const randomPassword = crypto.randomBytes(32).toString('base64url')
    try {
      await getPurelymailClient().setPassword(mailbox.localPart, randomPassword)
    } catch {
      return NextResponse.json({ error: 'Failed to rotate password in Purelymail' }, { status: 502 })
    }
    await prisma.mailbox.update({
      where: { id },
      data: { status: 'PROVISIONED_AWAITING_PASSWORD' },
    })
  }

  const tokenResult = await issueSetupToken({
    memberId: mailbox.memberId,
    mailboxId: id,
    issuedByMemberId: session.memberId,
  })

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3007'
  const setupUrl = `${baseUrl}/portal/mail/setup?token=${tokenResult.rawToken}`

  await writeMailAudit({
    action: 'PASSWORD_RESET_BY_ADMIN',
    actorMemberId: session.memberId,
    subjectMemberId: mailbox.memberId,
    mailboxId: id,
    metadata: { hard },
  })

  // Email the member
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
    console.error('[mail] reset-password email failed:', e instanceof Error ? e.message : 'unknown')
  }

  return NextResponse.json({ ok: true, setupUrl, expiresAt: tokenResult.expiresAt })
}
