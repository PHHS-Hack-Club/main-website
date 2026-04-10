import { SignJWT, jwtVerify } from 'jose'

const PURPOSE = 'mail-password-change'
const TTL_SECONDS = 5 * 60

function getSecret(): Uint8Array {
  const s = process.env.STEP_UP_JWT_SECRET
  if (!s) throw new Error('STEP_UP_JWT_SECRET is not configured')
  return new TextEncoder().encode(s)
}

export async function issueStepUpProof(memberId: string): Promise<string> {
  const secret = getSecret()
  return new SignJWT({ sub: memberId, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .setJti(crypto.randomUUID())
    .sign(secret)
}

export async function verifyStepUpProof(token: string, memberId: string): Promise<boolean> {
  try {
    const secret = getSecret()
    const { payload } = await jwtVerify(token, secret)
    return payload.sub === memberId && payload.purpose === PURPOSE
  } catch {
    return false
  }
}
