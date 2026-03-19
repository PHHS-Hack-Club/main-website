import { NextRequest, NextResponse } from 'next/server'
import { createSession, getSession, setSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  isUsernameTaken,
  normalizeUsername,
  validateUsername,
} from '@/lib/member-username'

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url))
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return redirectTo(request, '/')
  }

  const formData = await request.formData()
  const rawUsername = formData.get('username')

  if (typeof rawUsername !== 'string' || rawUsername.trim().length === 0) {
    return redirectTo(request, '/portal/setup?error=missing')
  }

  const username = normalizeUsername(rawUsername)
  const validationError = validateUsername(username)

  if (validationError) {
    return redirectTo(request, '/portal/setup?error=invalid')
  }

  if (await isUsernameTaken(username, session.memberId)) {
    return redirectTo(request, '/portal/setup?error=taken')
  }

  const member = await prisma.member.update({
    where: { id: session.memberId },
    data: { username },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      username: true,
    },
  })

  const token = await createSession({
    memberId: member.id,
    email: member.email,
    name: member.name,
    role: member.role,
    username: member.username,
  })

  const response = redirectTo(request, '/portal')
  setSessionCookie(response, token)
  return response
}
