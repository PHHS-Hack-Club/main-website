import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface HackatimeProject {
  name: string
  total_seconds: number
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { hackatimeToken: true },
  })

  if (!member?.hackatimeToken) {
    return NextResponse.json({ connected: false, projects: [] })
  }

  const res = await fetch('https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=true', {
    headers: { Authorization: `Bearer ${member.hackatimeToken}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.json({ connected: true, error: 'fetch_failed', projects: [] })
  }

  const data = await res.json() as { projects: HackatimeProject[] }
  const projects = (data.projects ?? [])
    .map((p) => p.name)
    .sort()

  return NextResponse.json({ connected: true, projects })
}
