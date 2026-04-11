import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeMailAudit } from '@/lib/mail-audit'

const DEFAULT_GRACE_DAYS = 30

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const graceDays = typeof body.graceDays === 'number' ? body.graceDays : DEFAULT_GRACE_DAYS

  const mailbox = await prisma.mailbox.findUnique({ where: { id } })
  if (!mailbox) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (mailbox.status === 'DELETED') return NextResponse.json({ error: 'Already deleted' }, { status: 409 })

  const deleteAfter = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000)

  await prisma.$transaction(async (tx) => {
    await tx.mailbox.update({
      where: { id },
      data: { status: 'PENDING_DELETION', deleteAfter },
    })
    await writeMailAudit(
      {
        action: 'MAILBOX_DELETION_SCHEDULED',
        actorMemberId: session.memberId,
        subjectMemberId: mailbox.memberId,
        mailboxId: id,
        metadata: { graceDays, deleteAfter },
      },
      tx,
    )
  })

  // Fire-and-forget warning email
  try {
    const email = await import('@/lib/email') as any
    if (typeof email.sendMailDeletionWarningToMember === 'function') {
      const member = await prisma.member.findUnique({ where: { id: mailbox.memberId } })
      if (member) {
        await email.sendMailDeletionWarningToMember({
          memberEmail: member.email,
          memberName: member.name,
          fullAddress: `${mailbox.localPart}@${mailbox.domain}`,
          deleteAfter,
          daysRemaining: graceDays,
        })
      }
    }
  } catch (e) {
    console.error('[mail] deletion warning email failed:', e instanceof Error ? e.message : 'unknown')
  }

  return NextResponse.json({ ok: true, deleteAfter })
}
