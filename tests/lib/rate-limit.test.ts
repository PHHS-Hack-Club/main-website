import { describe, it, expect, vi, afterEach } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-${Math.random()}`
    expect(rateLimit(key, 3, 60000).ok).toBe(true)
    expect(rateLimit(key, 3, 60000).ok).toBe(true)
    expect(rateLimit(key, 3, 60000).ok).toBe(true)
  })

  it('blocks at the limit', () => {
    const key = `test-${Math.random()}`
    rateLimit(key, 2, 60000)
    rateLimit(key, 2, 60000)
    expect(rateLimit(key, 2, 60000).ok).toBe(false)
  })

  it('resets after the window expires', () => {
    vi.useFakeTimers()
    const key = `test-${Math.random()}`
    rateLimit(key, 1, 1000)
    expect(rateLimit(key, 1, 1000).ok).toBe(false)
    vi.advanceTimersByTime(1001)
    expect(rateLimit(key, 1, 1000).ok).toBe(true)
  })

  it('different keys are independent', () => {
    const k1 = `test-${Math.random()}`
    const k2 = `test-${Math.random()}`
    rateLimit(k1, 1, 60000)
    expect(rateLimit(k1, 1, 60000).ok).toBe(false)
    expect(rateLimit(k2, 1, 60000).ok).toBe(true)
  })

  it('returns resetAt timestamp', () => {
    const key = `test-${Math.random()}`
    const before = Date.now()
    const { resetAt } = rateLimit(key, 5, 60000)
    expect(resetAt).toBeGreaterThanOrEqual(before + 60000)
  })
})
