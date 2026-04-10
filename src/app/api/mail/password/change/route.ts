import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyStepUpProof } from '@/lib/step-up'
import { getPurelymailClient } from '@/lib/purelymail'
import { writeMailAudit } from '@/lib/mail-audit'
import { rateLimit } from '@/lib/rate-limit'

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

  const rl = rateLimit(`mail:change:${session.memberId}`, 5, 60 * 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  // Require step-up proof cookie
  const stepupProof = req.cookies.get('stepup_proof')?.value
  if (!stepupProof) {
    return NextResponse.json({ error: 'Step-up authentication required' }, { status: 403 })
  }
  const validProof = await verifyStepUpProof(stepupProof, session.memberId)
  if (!validProof) {
    return NextResponse.json({ error: 'Step-up proof is invalid or expired' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { newPassword } = body ?? {}

  const passwordError = validatePassword(newPassword)
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })

  const mailbox = await prisma.mailbox.findUnique({
    where: { memberId: session.memberId },
  })
  if (!mailbox || mailbox.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Active mailbox not found' }, { status: 404 })
  }

  // Update password in Purelymail — newPassword is NOT stored or logged
  try {
    await getPurelymailClient().setPassword(mailbox.localPart, newPassword)
  } catch {
    return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 502 })
  }

  await writeMailAudit({
    action: 'PASSWORD_CHANGED',
    actorMemberId: session.memberId,
    subjectMemberId: session.memberId,
    mailboxId: mailbox.id,
  })

  // Fire-and-forget notification
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const email = await import('@/lib/email') as any
    if (typeof email.sendMailPasswordChangedToMember === 'function') {
      await email.sendMailPasswordChangedToMember({
        memberEmail: session.email,
        memberName: session.name,
        fullAddress: `${mailbox.localPart}@${mailbox.domain}`,
      })
    }
  } catch (e) {
    console.error('[mail] password change notification failed:', e instanceof Error ? e.message : 'unknown')
  }

  const res = NextResponse.json({ ok: true })
  // Clear the step-up proof after use
  res.cookies.set('stepup_proof', '', { expires: new Date(0), path: '/' })
  return res
}
