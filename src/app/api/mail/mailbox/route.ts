import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const mailbox = await prisma.mailbox.findUnique({
    where: { memberId: session.memberId },
    select: {
      id: true,
      localPart: true,
      domain: true,
      status: true,
      provisionedAt: true,
      activatedAt: true,
      suspendedAt: true,
      deleteAfter: true,
      createdAt: true,
    },
  })

  if (!mailbox) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ mailbox })
}
