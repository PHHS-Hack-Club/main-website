import { NextRequest, NextResponse } from 'next/server'
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
  const { searchParams } = new URL(req.url)
  const confirm = searchParams.get('confirm')

  const mailbox = await prisma.mailbox.findUnique({ where: { id } })
  if (!mailbox) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (mailbox.status === 'DELETED') return NextResponse.json({ error: 'Already deleted' }, { status: 409 })

  // Require ?confirm=<localPart> to prevent accidental deletion
  if (confirm !== mailbox.localPart) {
    return NextResponse.json(
      { error: `Confirm by passing ?confirm=${mailbox.localPart}` },
      { status: 400 },
    )
  }

  try {
    await getPurelymailClient().deleteUser(mailbox.localPart)
  } catch {
    return NextResponse.json({ error: 'Failed to delete mailbox in Purelymail' }, { status: 502 })
  }

  const now = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.mailbox.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: now,
        deleteAfter: null,
        ssoPasswordCiphertext: null,
      },
    })
    await writeMailAudit(
      {
        action: 'MAILBOX_DELETED',
        actorMemberId: session.memberId,
        subjectMemberId: mailbox.memberId,
        mailboxId: id,
        metadata: { localPart: mailbox.localPart, domain: mailbox.domain },
      },
      tx,
    )
  })

  return NextResponse.json({ ok: true })
}
