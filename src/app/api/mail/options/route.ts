import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCandidates } from '@/lib/mail-naming'
import { checkCandidateAvailability } from '@/lib/mail-availability'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: {
      mailbox: true,
      emailRequests: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (member.mailbox) {
    return NextResponse.json({
      mailbox: {
        localPart: member.mailbox.localPart,
        domain: member.mailbox.domain,
        status: member.mailbox.status,
      },
      candidates: [],
    })
  }

  const pending = member.emailRequests[0]
  if (pending) {
    return NextResponse.json({
      pending: {
        id: pending.id,
        requestedLocalPart: pending.requestedLocalPart,
        domain: pending.domain,
        createdAt: pending.createdAt,
      },
      candidates: [],
    })
  }

  const domain = process.env.PURELYMAIL_DOMAIN || 'phhshack.club'
  const candidates = generateCandidates(member.name)
  const avail = await checkCandidateAvailability(
    candidates.map((c) => c.localPart),
    domain,
  )

  return NextResponse.json({
    candidates: candidates.map((c) => {
      const a = avail.get(c.localPart)
      return {
        localPart: c.localPart,
        format: c.format,
        available: a?.available ?? false,
        reason: a?.reason,
      }
    }),
  })
}
