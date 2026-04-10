import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { issueStepUpProof } from '@/lib/step-up'

// Issues a short-lived (5 min) step-up JWT cookie after verifying the session.
// V1 approach: trust the existing session (re-validates it is present and valid).
// The step-up cookie adds a second layer that must be presented for password changes.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const proof = await issueStepUpProof(session.memberId)

  const res = NextResponse.json({ ok: true })
  res.cookies.set('stepup_proof', proof, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60,
    path: '/',
  })
  return res
}
