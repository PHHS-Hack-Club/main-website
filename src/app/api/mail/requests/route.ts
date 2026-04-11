import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCandidates, isValidLocalPart } from '@/lib/mail-naming'
import { checkCandidateAvailability } from '@/lib/mail-availability'
import { writeMailAudit } from '@/lib/mail-audit'
import { rateLimit } from '@/lib/rate-limit'

async function notifyAdmins(memberName: string, localPart: string, domain: string) {
  try {
    const email = await import('@/lib/email') as any
    if (typeof email.sendMailRequestSubmittedToAdmins === 'function') {
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3007'
      await email.sendMailRequestSubmittedToAdmins({
        memberName,
        localPart,
        domain,
        adminUrl: `${baseUrl}/admin/mail/requests`,
      })
    }
  } catch (e) {
    console.error('[mail] admin notification failed:', e instanceof Error ? e.message : 'unknown')
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`mail:request:${session.memberId}`, 5, 24 * 60 * 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const localPart = body?.localPart
  if (typeof localPart !== 'string' || !isValidLocalPart(localPart)) {
    return NextResponse.json({ error: 'Invalid local part' }, { status: 400 })
  }

  const domain = process.env.PURELYMAIL_DOMAIN || 'phhshack.club'

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: {
      mailbox: { select: { id: true } },
      emailRequests: { where: { status: 'PENDING' }, take: 1 },
    },
  })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (member.mailbox) return NextResponse.json({ error: 'Mailbox already exists' }, { status: 409 })
  if (member.emailRequests.length > 0) {
    return NextResponse.json({ error: 'Pending request already exists' }, { status: 409 })
  }

  // Validate that the local part is in the allowed candidate list
  const candidates = generateCandidates(member.name)
  const allowed = candidates.some((c) => c.localPart === localPart)
  if (!allowed) {
    return NextResponse.json({ error: 'Address not in allowed candidates' }, { status: 400 })
  }

  // Availability check
  const avail = await checkCandidateAvailability([localPart], domain)
  const availability = avail.get(localPart)
  if (!availability?.available) {
    return NextResponse.json(
      { error: 'Address unavailable', reason: availability?.reason },
      { status: 409 },
    )
  }

  const emailRequest = await prisma.$transaction(async (tx) => {
    const req = await tx.emailRequest.create({
      data: {
        memberId: session.memberId,
        requestedLocalPart: localPart,
        domain,
        status: 'PENDING',
      },
    })
    await writeMailAudit(
      {
        action: 'EMAIL_REQUEST_CREATED',
        actorMemberId: session.memberId,
        subjectMemberId: session.memberId,
        emailRequestId: req.id,
        metadata: { localPart, domain },
      },
      tx,
    )
    return req
  })

  // Fire-and-forget admin notification
  notifyAdmins(member.name, localPart, domain)

  return NextResponse.json(
    {
      id: emailRequest.id,
      localPart: emailRequest.requestedLocalPart,
      domain: emailRequest.domain,
      status: emailRequest.status,
      createdAt: emailRequest.createdAt,
    },
    { status: 201 },
  )
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requests = await prisma.emailRequest.findMany({
    where: { memberId: session.memberId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return NextResponse.json({ requests })
}
