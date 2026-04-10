import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPurelymailClient } from '@/lib/purelymail'
import { writeMailAudit } from '@/lib/mail-audit'

const WARNING_DAYS = [30, 14, 7, 1]

async function sendDeletionWarning(
  memberEmail: string,
  memberName: string,
  fullAddress: string,
  deleteAfter: Date,
  daysRemaining: number,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const email = await import('@/lib/email') as any
    if (typeof email.sendMailDeletionWarningToMember === 'function') {
      await email.sendMailDeletionWarningToMember({ memberEmail, memberName, fullAddress, deleteAfter, daysRemaining })
    }
  } catch (e) {
    console.error('[mail:expire] warning email failed:', e instanceof Error ? e.message : 'unknown')
  }
}

async function run(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Phase 1: hard delete mailboxes past their deleteAfter date
  const toDelete = await prisma.mailbox.findMany({
    where: { status: 'PENDING_DELETION', deleteAfter: { lte: now } },
    include: { member: { select: { email: true, name: true } } },
  })

  const deleted: string[] = []
  const deleteErrors: string[] = []

  for (const mailbox of toDelete) {
    try {
      await getPurelymailClient().deleteUser(mailbox.localPart)
      await prisma.$transaction(async (tx) => {
        await tx.mailbox.update({
          where: { id: mailbox.id },
          data: { status: 'DELETED', deletedAt: now },
        })
        await writeMailAudit(
          {
            action: 'MAILBOX_DELETED',
            mailboxId: mailbox.id,
            subjectMemberId: mailbox.memberId,
            metadata: { reason: 'grace_period_expired' },
          },
          tx,
        )
      })
      deleted.push(mailbox.localPart)
    } catch (e) {
      deleteErrors.push(`${mailbox.localPart}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // Phase 2: send warning emails for mailboxes approaching deletion
  const warned: string[] = []
  for (const days of WARNING_DAYS) {
    const windowStart = new Date(now.getTime() + (days - 1) * 24 * 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const approaching = await prisma.mailbox.findMany({
      where: {
        status: 'PENDING_DELETION',
        deleteAfter: { gte: windowStart, lt: windowEnd },
      },
      include: { member: { select: { email: true, name: true } } },
    })

    for (const mailbox of approaching) {
      await sendDeletionWarning(
        mailbox.member.email,
        mailbox.member.name,
        `${mailbox.localPart}@${mailbox.domain}`,
        mailbox.deleteAfter!,
        days,
      )
      warned.push(`${mailbox.localPart} (${days}d warning)`)
    }
  }

  return NextResponse.json({
    ok: true,
    deleted,
    deleteErrors,
    warned,
  })
}

export async function POST(request: NextRequest) { return run(request) }
export async function GET(request: NextRequest) { return run(request) }
