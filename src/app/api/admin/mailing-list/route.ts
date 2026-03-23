import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — list all entries with member info
export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const entries = await prisma.mailingListEntry.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      member: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ entries })
}

// DELETE — remove an entry
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await request.json()
  await prisma.mailingListEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
