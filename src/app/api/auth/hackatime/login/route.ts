import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

function siteUrl(path: string) {
  const base = process.env.HACKCLUB_REDIRECT_URI
    ? new URL(process.env.HACKCLUB_REDIRECT_URI).origin
    : 'http://localhost:3007'
  return new URL(path, base).toString()
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(siteUrl('/'))

  // returnTo is the page to redirect back to after OAuth (e.g. /portal/projects/new)
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/portal'

  const params = new URLSearchParams({
    client_id: process.env.HACKATIME_CLIENT_ID!,
    redirect_uri: process.env.HACKATIME_REDIRECT_URI!,
    response_type: 'code',
    scope: 'profile read',
    state: encodeURIComponent(returnTo),
  })

  return NextResponse.redirect(`https://hackatime.hackclub.com/oauth/authorize?${params}`)
}
