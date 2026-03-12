import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

function siteUrl(path: string) {
  const base = process.env.HACKCLUB_REDIRECT_URI
    ? new URL(process.env.HACKCLUB_REDIRECT_URI).origin
    : 'http://localhost:3007'
  return `${base}${path}`
}

export async function GET(_request: NextRequest) {
  const response = NextResponse.redirect(siteUrl('/'))
  clearSessionCookie(response)
  return response
}
