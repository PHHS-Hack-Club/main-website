import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export interface IssueTokenResult {
  rawToken: string
  tokenId: string
  expiresAt: Date
}

export async function issueSetupToken(params: {
  memberId: string
  mailboxId: string
  ttlHours?: number
  issuedByMemberId?: string | null
}): Promise<IssueTokenResult> {
  const rawToken = crypto.randomBytes(32).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const ttlHours = params.ttlHours ?? 24
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000)

  const token = await prisma.passwordSetupToken.create({
    data: {
      memberId: params.memberId,
      mailboxId: params.mailboxId,
      tokenHash,
      expiresAt,
      issuedByMemberId: params.issuedByMemberId ?? null,
    },
  })

  return { rawToken, tokenId: token.id, expiresAt }
}

export async function verifyAndConsumeSetupToken(
  rawToken: string,
  memberId: string,
): Promise<{ mailboxId: string } | null> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const now = new Date()

  const token = await prisma.passwordSetupToken.findUnique({
    where: { tokenHash },
  })

  if (!token) return null
  if (token.memberId !== memberId) return null
  if (token.consumedAt !== null) return null
  if (token.expiresAt <= now) return null

  await prisma.passwordSetupToken.update({
    where: { id: token.id },
    data: { consumedAt: now },
  })

  return { mailboxId: token.mailboxId }
}
