import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const members = await prisma.member.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(members)
}
