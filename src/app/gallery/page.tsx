import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'
import GallerySearch from '@/components/GallerySearch'

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

async function buildHoursMap(
  projects: { id: string; hackatimeProject: string | null; member: { id: string; hackatimeToken: string | null } }[]
): Promise<Map<string, string>> {
  const memberTokens = new Map<string, string>()
  for (const p of projects) {
    if (p.hackatimeProject && p.member.hackatimeToken && !memberTokens.has(p.member.id)) {
      memberTokens.set(p.member.id, p.member.hackatimeToken)
    }
  }

  const memberProjectSeconds = new Map<string, Map<string, number>>()
  await Promise.all(
    [...memberTokens.entries()].map(async ([memberId, token]) => {
      try {
        const res = await fetch(
          'https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=true',
          { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 3600 } }
        )
        if (!res.ok) return
        const data = await res.json() as { projects: { name: string; total_seconds: number }[] }
        const byName = new Map<string, number>()
        for (const p of data.projects ?? []) byName.set(p.name.toLowerCase(), p.total_seconds)
        memberProjectSeconds.set(memberId, byName)
      } catch {
        // silently skip
      }
    })
  )

  const hours = new Map<string, string>()
  for (const p of projects) {
    if (!p.hackatimeProject) continue
    const byName = memberProjectSeconds.get(p.member.id)
    if (!byName) continue
    const seconds = byName.get(p.hackatimeProject.toLowerCase())
    if (seconds) hours.set(p.id, formatSeconds(seconds))
  }
  return hours
}

export default async function GalleryPage() {
  const [projects, devlogs] = await Promise.all([
    prisma.project.findMany({
      where: { status: 'APPROVED' },
      include: {
        member: { select: { id: true, name: true, hackatimeToken: true } },
        images: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.devlog.findMany({
      where: { status: 'APPROVED' },
      include: {
        member: { select: { name: true } },
        project: { select: { title: true, id: true } },
        images: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const hoursMap = await buildHoursMap(projects)

  const serializedProjects = projects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    tags: p.tags,
    memberName: p.member.name,
    imageUrl: p.images[0] ? getFileUrl(p.images[0].minioKey) : null,
    imageAlt: p.images[0]?.originalFilename ?? null,
    hours: hoursMap.get(p.id) ?? null,
  }))

  const serializedDevlogs = devlogs.map((d) => ({
    id: d.id,
    title: d.title,
    body: d.body,
    memberName: d.member.name,
    projectTitle: d.project?.title ?? null,
    projectId: d.project?.id ?? null,
    imageUrl: d.images[0] ? getFileUrl(d.images[0].minioKey) : null,
    imageAlt: d.images[0]?.originalFilename ?? null,
  }))

  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
      <div className="stack">
        <div className="animate-up">
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'// GALLERY'}</p>
          <h1 className="glow-red" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>What we&apos;ve built.</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>Approved projects and devlogs from PHHS Coding Club members.</p>
        </div>

        <GallerySearch projects={serializedProjects} devlogs={serializedDevlogs} />
      </div>
    </div>
  )
}
