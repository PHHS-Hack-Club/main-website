import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    passwordSetupToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { issueSetupToken, verifyAndConsumeSetupToken } from '@/lib/mail-tokens'
import { prisma } from '@/lib/prisma'

const mockCreate = prisma.passwordSetupToken.create as ReturnType<typeof vi.fn>
const mockFindUnique = prisma.passwordSetupToken.findUnique as ReturnType<typeof vi.fn>
const mockUpdate = prisma.passwordSetupToken.update as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('issueSetupToken', () => {
  it('creates a token with sha256 hash stored (not raw)', async () => {
    mockCreate.mockResolvedValue({ id: 'tok1', tokenHash: 'h1', expiresAt: new Date() })
    const result = await issueSetupToken({ memberId: 'm1', mailboxId: 'mb1' })
    expect(result.rawToken).toBeTruthy()
    expect(result.rawToken.length).toBeGreaterThan(20)
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.data.tokenHash).not.toBe(result.rawToken)
    const expectedHash = crypto.createHash('sha256').update(result.rawToken).digest('hex')
    expect(callArg.data.tokenHash).toBe(expectedHash)
  })

  it('uses default 24h TTL', async () => {
    const before = Date.now()
    mockCreate.mockImplementation(async ({ data }: any) => ({ id: 'tok1', ...data }))
    const result = await issueSetupToken({ memberId: 'm1', mailboxId: 'mb1' })
    const diffMs = result.expiresAt.getTime() - before
    expect(diffMs).toBeGreaterThanOrEqual(23 * 60 * 60 * 1000)
    expect(diffMs).toBeLessThanOrEqual(25 * 60 * 60 * 1000)
  })
})

describe('verifyAndConsumeSetupToken', () => {
  it('returns mailboxId for a valid token', async () => {
    const rawToken = 'testrawtoken123'
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex')
    mockFindUnique.mockResolvedValue({
      id: 'tok1', memberId: 'm1', mailboxId: 'mb1',
      tokenHash: hash, expiresAt: new Date(Date.now() + 10000), consumedAt: null,
    })
    mockUpdate.mockResolvedValue({})
    const result = await verifyAndConsumeSetupToken(rawToken, 'm1')
    expect(result?.mailboxId).toBe('mb1')
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'tok1' } }))
  })

  it('returns null if memberId mismatches', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'tok1', memberId: 'm1', mailboxId: 'mb1',
      expiresAt: new Date(Date.now() + 10000), consumedAt: null,
    })
    const result = await verifyAndConsumeSetupToken('rawtoken', 'm2')
    expect(result).toBeNull()
  })

  it('returns null if token already consumed', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'tok1', memberId: 'm1', mailboxId: 'mb1',
      expiresAt: new Date(Date.now() + 10000), consumedAt: new Date(),
    })
    const result = await verifyAndConsumeSetupToken('rawtoken', 'm1')
    expect(result).toBeNull()
  })

  it('returns null if token expired', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'tok1', memberId: 'm1', mailboxId: 'mb1',
      expiresAt: new Date(Date.now() - 1000), consumedAt: null,
    })
    const result = await verifyAndConsumeSetupToken('rawtoken', 'm1')
    expect(result).toBeNull()
  })

  it('returns null if token not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const result = await verifyAndConsumeSetupToken('notexist', 'm1')
    expect(result).toBeNull()
  })
})
