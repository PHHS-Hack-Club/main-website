import { NextRequest, NextResponse } from 'next/server'
import { createSession, getSession, setSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  isUsernameTaken,
  normalizeUsername,
  validateUsername,
} from '@/lib/member-username'
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
  const username = normalizeUsername(body.username)
  const headline = normalizeHeadline(body.headline)
  const bio = normalizeBio(body.bio)
  const websiteUrl = body.websiteUrl?.trim()
    ? normalizeExternalUrl(body.websiteUrl)
    : null
  const githubUrl = body.githubUrl?.trim()
    ? normalizeExternalUrl(body.githubUrl)
    : null

  const usernameError = validateUsername(username)
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 })
  }

  if (body.websiteUrl?.trim() && !websiteUrl) {
    return NextResponse.json({ error: 'Website URL must be a valid http or https URL.' }, { status: 400 })
  }

  if (body.githubUrl?.trim() && !githubUrl) {
    return NextResponse.json({ error: 'GitHub URL must be a valid http or https URL.' }, { status: 400 })
  }

  if (await isUsernameTaken(username, session.memberId)) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
  }

  const member = await prisma.member.update({
    where: { id: session.memberId },
    data: {
      username,
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

  const token = await createSession({
    memberId: member.id,
    email: member.email,
    name: member.name,
    role: member.role,
    username: member.username,
  })

  const response = NextResponse.json(member)
  setSessionCookie(response, token)
  return response
}
