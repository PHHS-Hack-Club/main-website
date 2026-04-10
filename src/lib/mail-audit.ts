import type { MailAuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface AuditEntry {
  action: MailAuditAction
  actorMemberId?: string | null
  subjectMemberId?: string | null
  mailboxId?: string | null
  emailRequestId?: string | null
  metadata?: Record<string, unknown>
}

export async function writeMailAudit(
  entry: AuditEntry,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma
  await client.mailAuditLog.create({
    data: {
      action: entry.action,
      actorMemberId: entry.actorMemberId ?? null,
      subjectMemberId: entry.subjectMemberId ?? null,
      mailboxId: entry.mailboxId ?? null,
      emailRequestId: entry.emailRequestId ?? null,
      metadata: (entry.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  })
}
