interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; resetAt: number } {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, resetAt }
  }

  if (existing.count >= limit) {
    return { ok: false, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { ok: true, resetAt: existing.resetAt }
}
