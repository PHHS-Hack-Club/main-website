import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { schoolEmail } = await request.json()

  if (!schoolEmail?.trim()) {
    return NextResponse.json({ error: 'School email is required' }, { status: 400 })
  }

  const normalized = schoolEmail.trim().toLowerCase()

  if (!normalized.endsWith('@pascack.org')) {
    return NextResponse.json({ error: 'Must be a @pascack.org email address' }, { status: 400 })
  }

  await prisma.member.update({
    where: { id: session.memberId },
    data: { schoolEmail: normalized },
  })

  // Auto-merge: link any kiosk mailing list entry with this school email
  await prisma.mailingListEntry.updateMany({
    where: { schoolEmail: normalized, memberId: null },
    data: { memberId: session.memberId },
  })

  return NextResponse.json({ success: true })
}
