import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyAndConsumeSetupToken } from '@/lib/mail-tokens'
import { getPurelymailClient } from '@/lib/purelymail'
import { writeMailAudit } from '@/lib/mail-audit'
import { rateLimit } from '@/lib/rate-limit'
import { encryptMailboxPassword } from '@/lib/mail-sso'

function validatePassword(password: string): string | null {
  if (typeof password !== 'string') return 'Password is required'
  if (password.length < 12) return 'Password must be at least 12 characters'
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  return null
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`mail:setup:${session.memberId}`, 10, 60 * 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const { token, password } = body ?? {}

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const passwordError = validatePassword(password)
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })
  const ssoPasswordCiphertext = encryptMailboxPassword(password)

  const tokenResult = await verifyAndConsumeSetupToken(token, session.memberId)
  if (!tokenResult) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  const mailbox = await prisma.mailbox.findUnique({ where: { id: tokenResult.mailboxId } })
  if (!mailbox || mailbox.memberId !== session.memberId) {
    return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
  }
  if (mailbox.status !== 'PROVISIONED_AWAITING_PASSWORD') {
    return NextResponse.json({ error: 'Mailbox is not awaiting password setup' }, { status: 409 })
  }

  // Set the password in Purelymail — password variable is not stored or logged
  try {
    await getPurelymailClient().setPassword(mailbox.localPart, password)
  } catch {
    return NextResponse.json({ error: 'Failed to set password. Please try again.' }, { status: 502 })
  }

  // Mark mailbox active
  const now = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.mailbox.update({
      where: { id: mailbox.id },
      data: {
        status: 'ACTIVE',
        activatedAt: now,
        ssoPasswordCiphertext,
      },
    })
    await writeMailAudit(
      {
        action: 'PASSWORD_SET_INITIAL',
        actorMemberId: session.memberId,
        subjectMemberId: session.memberId,
        mailboxId: mailbox.id,
      },
      tx,
    )
  })

  return NextResponse.json({ ok: true, address: `${mailbox.localPart}@${mailbox.domain}` })
}
