import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth'
import { findAvailableAutoUsername } from '@/lib/member-username'
import { sendVerificationNotification } from '@/lib/email'

function siteUrl(path: string) {
  const base = process.env.HACKCLUB_REDIRECT_URI
    ? new URL(process.env.HACKCLUB_REDIRECT_URI).origin
    : 'http://localhost:3007'
  return new URL(path, base)
}

function sanitizeReturnPath(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const returnTo = sanitizeReturnPath(request.cookies.get('auth_return')?.value ?? null)

  if (!code) {
    return NextResponse.redirect(siteUrl('/?error=no_code'))
  }

  const tokenResponse = await fetch('https://auth.hackclub.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.HACKCLUB_CLIENT_ID,
      client_secret: process.env.HACKCLUB_CLIENT_SECRET,
      redirect_uri: process.env.HACKCLUB_REDIRECT_URI,
      code,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  })

  if (!tokenResponse.ok) {
    return NextResponse.redirect(siteUrl('/?error=token_exchange'))
  }

  const tokenData = await tokenResponse.json()

  const userResponse = await fetch('https://auth.hackclub.com/oauth/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    cache: 'no-store',
  })

  if (!userResponse.ok) {
    return NextResponse.redirect(siteUrl('/?error=userinfo'))
  }

  const user = await userResponse.json()
  const { sub, name, email } = user as {
    sub: string
    name?: string
    email?: string
  }

  let member = await prisma.member.findUnique({
    where: { hackClubSub: sub },
  })

  if (member) {
    const nextName = name || member.name
    const nextEmail = email || member.email
    const autoUsername = member.username
      ? member.username
      : await findAvailableAutoUsername(nextName, member.id)

    member = await prisma.member.update({
      where: { id: member.id },
      data: {
        name: nextName,
        email: nextEmail,
        ...(member.username ? {} : { username: autoUsername }),
      },
    })

    const token = await createSession({
      memberId: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      username: member.username,
    })

    const response = NextResponse.redirect(siteUrl(returnTo || '/portal'))
    setSessionCookie(response, token)
    response.cookies.set('auth_return', '', {
      expires: new Date(0),
      path: '/',
    })
    return response
  }

  if (email && email === process.env.ADMIN_EMAIL) {
    const autoUsername = await findAvailableAutoUsername(name || 'Admin')

    const created = await prisma.member.create({
      data: {
        hackClubSub: sub,
        email,
        name: name || 'Admin',
        role: 'PRESIDENT',
        username: autoUsername,
      },
    })

    const token = await createSession({
      memberId: created.id,
      email: created.email,
      name: created.name,
      role: created.role,
      username: created.username,
    })

    const response = NextResponse.redirect(siteUrl(returnTo || '/portal'))
    setSessionCookie(response, token)
    response.cookies.set('auth_return', '', {
      expires: new Date(0),
      path: '/',
    })
    return response
  }

  if (email) {
    const pending = await prisma.verificationRequest.findFirst({
      where: {
        hackClubSub: sub,
        status: 'PENDING',
      },
    })

    if (!pending) {
      await prisma.verificationRequest.create({
        data: {
          hackClubSub: sub,
          email,
          name: name || email,
        },
      })

      const baseUrl = process.env.HACKCLUB_REDIRECT_URI
        ? new URL(process.env.HACKCLUB_REDIRECT_URI).origin
        : 'http://localhost:3007'
      sendVerificationNotification({
        name: name || email,
        email,
        adminUrl: `${baseUrl}/admin/verification`,
      }).catch(console.error)
    }
  }

  return NextResponse.redirect(siteUrl('/?pending=true'))
}
