import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  normalizeBio,
  normalizeExternalUrl,
  normalizeHeadline,
} from '@/lib/member-profile'

export async function PUT(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const headline = normalizeHeadline(body.headline)
  const bio = normalizeBio(body.bio)
  const websiteUrl = body.websiteUrl?.trim()
    ? normalizeExternalUrl(body.websiteUrl)
    : null
  const githubUrl = body.githubUrl?.trim()
    ? normalizeExternalUrl(body.githubUrl)
    : null

  if (body.websiteUrl?.trim() && !websiteUrl) {
    return NextResponse.json({ error: 'Website URL must be a valid http or https URL.' }, { status: 400 })
  }

  if (body.githubUrl?.trim() && !githubUrl) {
    return NextResponse.json({ error: 'GitHub URL must be a valid http or https URL.' }, { status: 400 })
  }

  const member = await prisma.member.update({
    where: { id: session.memberId },
    data: {
      headline,
      bio,
      websiteUrl,
      githubUrl,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      username: true,
      headline: true,
      bio: true,
      websiteUrl: true,
      githubUrl: true,
    },
  })

  return NextResponse.json(member)
}
