import { prisma } from '@/lib/prisma'

export interface CandidateAvailability {
  localPart: string
  available: boolean
  reason?: 'reserved' | 'taken' | 'pending' | 'cooldown'
}

const COOLDOWN_DAYS = 180

export async function checkCandidateAvailability(
  localParts: string[],
  domain: string,
  options?: {
    excludePendingRequestId?: string
  },
): Promise<Map<string, CandidateAvailability>> {
  if (localParts.length === 0) return new Map()

  const cooldownCutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000)

  const [reserved, activeMailboxes, deletedCooldown, pendingRequests] = await Promise.all([
    prisma.reservedLocalPart.findMany({
      where: { localPart: { in: localParts } },
      select: { localPart: true },
    }),
    prisma.mailbox.findMany({
      where: {
        localPart: { in: localParts },
        domain,
        status: { notIn: ['DELETED'] },
      },
      select: { localPart: true },
    }),
    prisma.mailbox.findMany({
      where: {
        localPart: { in: localParts },
        domain,
        status: 'DELETED',
        deletedAt: { gte: cooldownCutoff },
      },
      select: { localPart: true },
    }),
    prisma.emailRequest.findMany({
      where: {
        requestedLocalPart: { in: localParts },
        domain,
        status: 'PENDING',
        ...(options?.excludePendingRequestId
          ? { id: { not: options.excludePendingRequestId } }
          : {}),
      },
      select: { requestedLocalPart: true },
    }),
  ])

  const reservedSet = new Set(reserved.map((r) => r.localPart))
  const takenSet = new Set(activeMailboxes.map((m) => m.localPart))
  const cooldownSet = new Set(deletedCooldown.map((m) => m.localPart))
  const pendingSet = new Set(pendingRequests.map((r) => r.requestedLocalPart))

  const result = new Map<string, CandidateAvailability>()
  for (const lp of localParts) {
    if (reservedSet.has(lp)) {
      result.set(lp, { localPart: lp, available: false, reason: 'reserved' })
    } else if (takenSet.has(lp)) {
      result.set(lp, { localPart: lp, available: false, reason: 'taken' })
    } else if (cooldownSet.has(lp)) {
      result.set(lp, { localPart: lp, available: false, reason: 'cooldown' })
    } else if (pendingSet.has(lp)) {
      result.set(lp, { localPart: lp, available: false, reason: 'pending' })
    } else {
      result.set(lp, { localPart: lp, available: true })
    }
  }
  return result
}
