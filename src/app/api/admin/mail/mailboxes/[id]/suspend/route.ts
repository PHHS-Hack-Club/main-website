import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPurelymailClient } from '@/lib/purelymail'
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
  if (mailbox.status === 'SUSPENDED') return NextResponse.json({ error: 'Already suspended' }, { status: 409 })
  if (mailbox.status === 'DELETED') return NextResponse.json({ error: 'Mailbox is deleted' }, { status: 409 })

  // Rotate to a random password (never stored)
  const randomPassword = crypto.randomBytes(32).toString('base64url')
  try {
    await getPurelymailClient().setPassword(mailbox.localPart, randomPassword)
  } catch {
    return NextResponse.json({ error: 'Failed to rotate password in Purelymail' }, { status: 502 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.mailbox.update({
      where: { id },
      data: { status: 'SUSPENDED', suspendedAt: new Date() },
    })
    await writeMailAudit(
      {
        action: 'MAILBOX_SUSPENDED',
        actorMemberId: session.memberId,
        subjectMemberId: mailbox.memberId,
        mailboxId: id,
      },
      tx,
    )
  })

  // Fire-and-forget email
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const email = await import('@/lib/email') as any
    if (typeof email.sendMailSuspendedToMember === 'function') {
      const member = await prisma.member.findUnique({ where: { id: mailbox.memberId } })
      if (member) {
        await email.sendMailSuspendedToMember({
          memberEmail: member.email,
          memberName: member.name,
          fullAddress: `${mailbox.localPart}@${mailbox.domain}`,
        })
      }
    }
  } catch (e) {
    console.error('[mail] suspend email failed:', e instanceof Error ? e.message : 'unknown')
  }

  return NextResponse.json({ ok: true })
}
