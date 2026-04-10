import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const skip = (page - 1) * PAGE_SIZE

  const [entries, total] = await Promise.all([
    prisma.mailAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        actor: { select: { name: true } },
        subject: { select: { name: true } },
        mailbox: { select: { localPart: true, domain: true } },
      },
    }),
    prisma.mailAuditLog.count(),
  ])

  return NextResponse.json({ entries, total, page, pageSize: PAGE_SIZE })
}
