import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyStepUpProof } from '@/lib/step-up'
import { rateLimit } from '@/lib/rate-limit'
import { encryptMailboxPassword, verifyMailboxPassword } from '@/lib/mail-sso'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`mail:sso-sync:${session.memberId}`, 10, 60 * 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const stepupProof = req.cookies.get('stepup_proof')?.value
  if (!stepupProof) {
    return NextResponse.json({ error: 'Step-up authentication required' }, { status: 403 })
  }

  const validProof = await verifyStepUpProof(stepupProof, session.memberId)
  if (!validProof) {
    return NextResponse.json({ error: 'Step-up proof is invalid or expired' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { currentPassword } = body ?? {}

  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    return NextResponse.json({ error: 'Current mailbox password is required' }, { status: 400 })
  }

  const mailbox = await prisma.mailbox.findUnique({
    where: { memberId: session.memberId },
  })

  if (!mailbox || mailbox.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Active mailbox not found' }, { status: 404 })
  }

  const fullAddress = `${mailbox.localPart}@${mailbox.domain}`

  try {
    await verifyMailboxPassword(fullAddress, currentPassword)
  } catch {
    return NextResponse.json(
      { error: 'Mailbox password is incorrect or webmail SSO is unavailable' },
      { status: 400 },
    )
  }

  await prisma.mailbox.update({
    where: { id: mailbox.id },
    data: {
      ssoPasswordCiphertext: encryptMailboxPassword(currentPassword),
    },
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('stepup_proof', '', { expires: new Date(0), path: '/' })
  return res
}
