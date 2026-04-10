import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindMany = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reservedLocalPart: { findMany: vi.fn() },
    mailbox: { findMany: vi.fn() },
    emailRequest: { findMany: vi.fn() },
  },
}))

import { checkCandidateAvailability } from '@/lib/mail-availability'
import { prisma } from '@/lib/prisma'

const reservedFindMany = prisma.reservedLocalPart.findMany as ReturnType<typeof vi.fn>
const mailboxFindMany = prisma.mailbox.findMany as ReturnType<typeof vi.fn>
const requestFindMany = prisma.emailRequest.findMany as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  // default: nothing reserved, taken, or pending
  reservedFindMany.mockResolvedValue([])
  mailboxFindMany.mockResolvedValue([])
  requestFindMany.mockResolvedValue([])
})

describe('checkCandidateAvailability', () => {
  it('marks all available when nothing conflicts', async () => {
    const result = await checkCandidateAvailability(['alexradu', 'alex.radu'], 'phhshack.club')
    expect(result.get('alexradu')?.available).toBe(true)
    expect(result.get('alex.radu')?.available).toBe(true)
  })

  it('marks reserved local parts unavailable', async () => {
    reservedFindMany.mockResolvedValue([{ localPart: 'admin' }])
    const result = await checkCandidateAvailability(['admin', 'alexradu'], 'phhshack.club')
    expect(result.get('admin')?.available).toBe(false)
    expect(result.get('admin')?.reason).toBe('reserved')
    expect(result.get('alexradu')?.available).toBe(true)
  })

  it('marks taken local parts (active mailbox) unavailable', async () => {
    mailboxFindMany
      .mockResolvedValueOnce([{ localPart: 'alexradu' }]) // active mailboxes
      .mockResolvedValueOnce([]) // deleted cooldown
    const result = await checkCandidateAvailability(['alexradu'], 'phhshack.club')
    expect(result.get('alexradu')?.available).toBe(false)
    expect(result.get('alexradu')?.reason).toBe('taken')
  })

  it('marks cooldown local parts unavailable', async () => {
    mailboxFindMany
      .mockResolvedValueOnce([]) // active
      .mockResolvedValueOnce([{ localPart: 'alexradu' }]) // deleted cooldown
    const result = await checkCandidateAvailability(['alexradu'], 'phhshack.club')
    expect(result.get('alexradu')?.available).toBe(false)
    expect(result.get('alexradu')?.reason).toBe('cooldown')
  })

  it('marks pending request local parts unavailable', async () => {
    requestFindMany.mockResolvedValue([{ requestedLocalPart: 'alexradu' }])
    const result = await checkCandidateAvailability(['alexradu'], 'phhshack.club')
    expect(result.get('alexradu')?.available).toBe(false)
    expect(result.get('alexradu')?.reason).toBe('pending')
  })

  it('returns empty map for empty input', async () => {
    const result = await checkCandidateAvailability([], 'phhshack.club')
    expect(result.size).toBe(0)
  })

  it('reserved takes priority over taken', async () => {
    reservedFindMany.mockResolvedValue([{ localPart: 'admin' }])
    mailboxFindMany
      .mockResolvedValueOnce([{ localPart: 'admin' }])
      .mockResolvedValueOnce([])
    const result = await checkCandidateAvailability(['admin'], 'phhshack.club')
    expect(result.get('admin')?.reason).toBe('reserved')
  })
})
