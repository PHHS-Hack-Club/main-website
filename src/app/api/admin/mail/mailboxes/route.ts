import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const mailboxes = await prisma.mailbox.findMany({
    where: status ? { status: status as any } : undefined,
    include: { member: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ mailboxes })
}
