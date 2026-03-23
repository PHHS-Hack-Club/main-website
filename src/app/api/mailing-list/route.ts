import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { name, schoolEmail } = await request.json()

  if (!name?.trim() || !schoolEmail?.trim()) {
    return NextResponse.json({ error: 'Name and school email are required' }, { status: 400 })
  }

  const normalized = schoolEmail.trim().toLowerCase()

  if (!normalized.endsWith('@pascack.org')) {
    return NextResponse.json({ error: 'Must be a @pascack.org email address' }, { status: 400 })
  }

  // Check if a member already has this school email — auto-link immediately
  const existingMember = await prisma.member.findFirst({
    where: { schoolEmail: normalized },
    select: { id: true },
  })

  await prisma.mailingListEntry.upsert({
    where: { schoolEmail: normalized },
    update: {
      name: name.trim(),
      ...(existingMember ? { memberId: existingMember.id } : {}),
    },
    create: {
      name: name.trim(),
      schoolEmail: normalized,
      memberId: existingMember?.id ?? null,
    },
  })

  return NextResponse.json({ success: true })
}
