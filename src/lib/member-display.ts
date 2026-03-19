import type { Role } from '@prisma/client'

export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours === 0) return `${minutes}m`
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

export async function fetchTotalSeconds(token: string): Promise<number> {
  try {
    const response = await fetch(
      'https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=true',
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) return 0

    const data = await response.json() as {
      projects: { total_seconds: number }[]
    }

    return (data.projects ?? []).reduce((sum, project) => sum + project.total_seconds, 0)
  } catch {
    return 0
  }
}

export function getMemberInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const roleOrder: Record<Role, number> = {
  PRESIDENT: 0,
  VP: 1,
  MEMBER: 2,
}

export const roleLabel: Record<Role, string> = {
  PRESIDENT: 'President',
  VP: 'VP',
  MEMBER: 'Member',
}

export const roleColor: Record<Role, { color: string; bg: string; border: string }> = {
  PRESIDENT: {
    color: 'var(--red)',
    bg: 'rgba(236,55,80,0.1)',
    border: 'rgba(236,55,80,0.25)',
  },
  VP: {
    color: 'var(--purple)',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.25)',
  },
  MEMBER: {
    color: 'var(--muted)',
    bg: 'var(--raised)',
    border: 'var(--border)',
  },
}
