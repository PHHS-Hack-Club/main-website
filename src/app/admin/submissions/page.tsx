import Link from 'next/link'
import SubmissionsQueue from '@/components/admin/SubmissionsQueue'
import { prisma } from '@/lib/prisma'

export default async function SubmissionsPage() {
  const [projects, devlogs] = await Promise.all([
    prisma.project.findMany({
      where: { status: 'PENDING' },
      orderBy: { updatedAt: 'asc' },
      include: {
        member: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.devlog.findMany({
      where: { status: 'PENDING' },
      orderBy: { updatedAt: 'asc' },
      include: {
        member: {
          select: {
            name: true,
          },
        },
        project: {
          select: {
            title: true,
          },
        },
      },
    }),
  ])

  return (
    <div className="stack">
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Admin
      </Link>
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Submissions</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Review pending projects and devlogs before they land in the gallery.</p>
      </div>
      <SubmissionsQueue
        projects={projects.map((project) => ({
          id: project.id,
          title: project.title,
          author: project.member.name,
          status: project.status,
          description: project.description,
          githubUrl: project.githubUrl,
          demoUrl: project.demoUrl,
          isMarkdown: true,
        }))}
        devlogs={devlogs.map((devlog) => ({
          id: devlog.id,
          title: devlog.title,
          author: devlog.member.name,
          status: devlog.status,
          description: devlog.body,
          projectTitle: devlog.project?.title,
          isMarkdown: true,
        }))}
      />
    </div>
  )
}
