import { NextResponse } from 'next/server'

function sanitizeReturnPath(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

export async function GET(request: Request) {
  const params = new URLSearchParams({
    client_id: process.env.HACKCLUB_CLIENT_ID || '',
    redirect_uri: process.env.HACKCLUB_REDIRECT_URI || 'http://localhost:3007/api/auth/callback',
    response_type: 'code',
    scope: 'openid profile email',
  })

  const returnTo = sanitizeReturnPath(new URL(request.url).searchParams.get('return'))
  const response = NextResponse.redirect(`https://auth.hackclub.com/oauth/authorize?${params.toString()}`)

  if (returnTo) {
    response.cookies.set('auth_return', returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    })
  }

  return response
}
