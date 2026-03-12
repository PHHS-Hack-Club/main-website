import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me')

export interface SessionPayload {
  memberId: string
  email: string
  name: string
  role: 'PRESIDENT' | 'VP' | 'MEMBER'
}

export async function createSession(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  })
}

export function isAdmin(session: SessionPayload | null) {
  return session?.role === 'PRESIDENT' || session?.role === 'VP'
}
