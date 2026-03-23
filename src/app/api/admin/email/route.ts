import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMemberEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { to, subject, heading, body, ctaLabel, ctaUrl } = await request.json()

  if (!subject?.trim() || !heading?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'subject, heading, and body are required' }, { status: 400 })
  }

  // "to" can be:
  //  - a member id string  → single member
  //  - "all_members"       → all verified members
  //  - "all_mailing_list"  → all mailing list emails

  let addresses: { name: string; email: string }[] = []

  if (to === 'all_members') {
    const members = await prisma.member.findMany({
      select: { name: true, email: true },
      orderBy: { createdAt: 'asc' },
    })
    addresses = members.map((m) => ({ name: m.name, email: m.email }))
  } else if (to === 'all_mailing_list') {
    // Collect: all member emails + unmapped mailing list entries, deduplicated
    const [members, entries] = await Promise.all([
      prisma.member.findMany({ select: { name: true, email: true } }),
      prisma.mailingListEntry.findMany({
        where: { memberId: null }, // unmerged only — merged ones covered by member query
        select: { name: true, schoolEmail: true },
      }),
    ])
    const seen = new Set<string>()
    for (const m of members) {
      if (!seen.has(m.email)) { seen.add(m.email); addresses.push({ name: m.name, email: m.email }) }
    }
    for (const e of entries) {
      if (!seen.has(e.schoolEmail)) { seen.add(e.schoolEmail); addresses.push({ name: e.name, email: e.schoolEmail }) }
    }
  } else {
    // Single member by id
    const member = await prisma.member.findUnique({ where: { id: to }, select: { name: true, email: true } })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    addresses = [{ name: member.name, email: member.email }]
  }

  // Send sequentially to avoid overwhelming SMTP
  let sent = 0
  const errors: string[] = []
  for (const addr of addresses) {
    try {
      await sendMemberEmail({
        to: addr.email,
        subject: subject.trim(),
        heading: heading.trim(),
        body: body.trim(),
        ...(ctaLabel ? { ctaLabel } : {}),
        ...(ctaUrl ? { ctaUrl } : {}),
      })
      sent++
    } catch (err) {
      errors.push(`${addr.email}: ${err instanceof Error ? err.message : 'failed'}`)
    }
  }

  return NextResponse.json({ sent, total: addresses.length, errors })
}
