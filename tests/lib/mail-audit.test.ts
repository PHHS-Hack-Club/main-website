import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma BEFORE importing the module under test
vi.mock('@/lib/prisma', () => ({
  prisma: {
    mailAuditLog: {
      create: vi.fn().mockResolvedValue({ id: 'audit1' }),
    },
  },
}))

import { writeMailAudit } from '@/lib/mail-audit'
import { prisma } from '@/lib/prisma'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('writeMailAudit', () => {
  it('calls prisma.mailAuditLog.create with correct fields', async () => {
    await writeMailAudit({
      action: 'MAILBOX_PROVISIONED',
      subjectMemberId: 'm1',
      metadata: { foo: 'bar' },
    })
    expect(prisma.mailAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'MAILBOX_PROVISIONED',
        subjectMemberId: 'm1',
        metadata: { foo: 'bar' },
      }),
    })
  })

  it('defaults nullable fields to null', async () => {
    await writeMailAudit({ action: 'EMAIL_REQUEST_CREATED' })
    expect(prisma.mailAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorMemberId: null,
        subjectMemberId: null,
        mailboxId: null,
        emailRequestId: null,
      }),
    })
  })

  it('uses provided tx instead of default prisma client', async () => {
    const tx = {
      mailAuditLog: { create: vi.fn().mockResolvedValue({ id: 'audit2' }) },
    }
    await writeMailAudit({ action: 'PASSWORD_SET_INITIAL', subjectMemberId: 'm1' }, tx as any)
    expect(tx.mailAuditLog.create).toHaveBeenCalled()
    expect(prisma.mailAuditLog.create).not.toHaveBeenCalled()
  })
})
