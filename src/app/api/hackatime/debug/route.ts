import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { hackatimeToken: true },
  })

  if (!member?.hackatimeToken) return NextResponse.json({ error: 'No token stored' })

  const [meRes, projectsRes] = await Promise.all([
    fetch('https://hackatime.hackclub.com/api/v1/authenticated/me', {
      headers: { Authorization: `Bearer ${member.hackatimeToken}` },
      cache: 'no-store',
    }),
    fetch('https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=true', {
      headers: { Authorization: `Bearer ${member.hackatimeToken}` },
      cache: 'no-store',
    }),
  ])

  return NextResponse.json({
    me_status: meRes.status,
    me: await meRes.json().catch(() => null),
    projects_status: projectsRes.status,
    projects: await projectsRes.json().catch(() => null),
  })
}
