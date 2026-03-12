import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function siteUrl(path: string) {
  const base = process.env.HACKCLUB_REDIRECT_URI
    ? new URL(process.env.HACKCLUB_REDIRECT_URI).origin
    : 'http://localhost:3007'
  return new URL(path, base).toString()
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(siteUrl('/'))

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const returnTo = state ? decodeURIComponent(state) : '/portal'

  if (!code) {
    return NextResponse.redirect(siteUrl(`${returnTo}?hackatime_error=no_code`))
  }

  const tokenBody = new URLSearchParams({
    client_id: process.env.HACKATIME_CLIENT_ID!,
    client_secret: process.env.HACKATIME_CLIENT_SECRET!,
    redirect_uri: process.env.HACKATIME_REDIRECT_URI!,
    code,
    grant_type: 'authorization_code',
  })

  const tokenRes = await fetch('https://hackatime.hackclub.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
    cache: 'no-store',
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(siteUrl(`${returnTo}?hackatime_error=token_exchange`))
  }

  const tokenData = await tokenRes.json() as { access_token: string }

  await prisma.member.update({
    where: { id: session.memberId },
    data: { hackatimeToken: tokenData.access_token },
  })

  return NextResponse.redirect(siteUrl(`${returnTo}?hackatime_connected=1`))
}
