import { NextRequest, NextResponse } from 'next/server'

interface MiddlewareSessionPayload {
  role?: 'PRESIDENT' | 'VP' | 'MEMBER'
}

function decodePayload(token: string): MiddlewareSessionPayload | null {
  const parts = token.split('.')

  if (parts.length < 2) {
    return null
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const json = atob(padded)
    return JSON.parse(json) as MiddlewareSessionPayload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    const payload = decodePayload(token)

    if (!payload) {
      throw new Error('Invalid session')
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (payload.role !== 'PRESIDENT' && payload.role !== 'VP') {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
    }

    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*'],
}
