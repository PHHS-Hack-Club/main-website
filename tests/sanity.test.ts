import { describe, it, expect } from 'vitest'

describe('vitest sanity', () => {
  it('runs a test', () => {
    expect(1 + 1).toBe(2)
  })

  it('resolves @ alias', async () => {
    const mod = await import('@/lib/prisma')
    expect(mod.prisma).toBeDefined()
  })
})
