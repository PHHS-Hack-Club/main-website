import { prisma } from '@/lib/prisma'

export function normalizeUsername(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function buildDefaultUsername(name: string): string | null {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((part) => normalizeUsername(part))
    .filter(Boolean)

  if (parts.length === 0) return null
  if (parts.length === 1) return parts[0]

  return `${parts[0]}${parts[parts.length - 1]}`
}

export function validateUsername(username: string): string | null {
  if (!username) return 'Choose a username.'
  if (username.length < 3) return 'Use at least 3 characters.'
  if (username.length > 32) return 'Use 32 characters or fewer.'
  if (!/^[a-z0-9]+$/.test(username)) return 'Use only lowercase letters and numbers.'
  return null
}

export async function isUsernameTaken(
  username: string,
  excludeMemberId?: string
): Promise<boolean> {
  const existing = await prisma.member.findFirst({
    where: {
      username,
      ...(excludeMemberId ? { NOT: { id: excludeMemberId } } : {}),
    },
    select: { id: true },
  })

  return Boolean(existing)
}

export async function findAvailableAutoUsername(
  name: string,
  excludeMemberId?: string
): Promise<string | null> {
  const candidate = buildDefaultUsername(name)

  if (!candidate) return null
  if (await isUsernameTaken(candidate, excludeMemberId)) return null

  return candidate
}
