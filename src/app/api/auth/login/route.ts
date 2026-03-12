import { NextResponse } from 'next/server'

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.HACKCLUB_CLIENT_ID || '',
    redirect_uri: process.env.HACKCLUB_REDIRECT_URI || 'http://localhost:3007/api/auth/callback',
    response_type: 'code',
    scope: 'openid profile email',
  })

  return NextResponse.redirect(`https://auth.hackclub.com/oauth/authorize?${params.toString()}`)
}
