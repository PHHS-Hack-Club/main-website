import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { provisionMailbox } from '@/lib/mail-provisioning'

async function sendApprovedEmail(memberEmail: string, memberName: string, localPart: string, domain: string, setupUrl: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const email = await import('@/lib/email') as any
    if (typeof email.sendMailRequestApprovedToMember === 'function') {
      await email.sendMailRequestApprovedToMember({ memberEmail, memberName, fullAddress: `${localPart}@${domain}`, setupUrl })
    }
  } catch (e) {
    console.error('[mail] approved email failed:', e instanceof Error ? e.message : 'unknown')
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  try {
    const result = await provisionMailbox({
      requestId: id,
      adminMemberId: session.memberId,
      localPart: body.localPart,
      adminOverrideReason: body.adminOverrideReason,
    })

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3007'
    const setupUrl = `${baseUrl}/portal/mail/setup?token=${result.rawToken}`

    // Look up member details for the email
    const { prisma } = await import('@/lib/prisma')
    const emailRequest = await prisma.emailRequest.findUnique({
      where: { id },
      include: { member: { select: { email: true, name: true } } },
    })
    const mailbox = await prisma.mailbox.findUnique({ where: { id: result.mailboxId } })

    if (emailRequest?.member && mailbox) {
      sendApprovedEmail(
        emailRequest.member.email,
        emailRequest.member.name,
        mailbox.localPart,
        mailbox.domain,
        setupUrl,
      )
    }

    return NextResponse.json({
      mailboxId: result.mailboxId,
      setupUrl,
      expiresAt: result.expiresAt,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Provisioning failed' },
      { status: 400 },
    )
  }
}
