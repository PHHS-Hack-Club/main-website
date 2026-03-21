import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'
import ProfilePictureUpload from '@/components/ProfilePictureUpload'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { profilePictureKey: true, username: true },
  })

  const profilePictureUrl = member?.profilePictureKey
    ? getFileUrl(member.profilePictureKey)
    : null

  return (
    <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-5)' }}>
      <div className="shell-grid">
        <aside className="card stack" style={{ position: 'sticky', top: 88 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <ProfilePictureUpload currentUrl={profilePictureUrl} name={session.name} />
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem', letterSpacing: '0.08em' }}>MEMBER PORTAL</p>
            <h2 style={{ marginBottom: '0.35rem' }}>{session.name}</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>{session.email}</p>
          </div>
          {!member?.username && (
            <p style={{ margin: 0, color: 'var(--orange)', fontSize: '0.86rem' }}>
              Ask an admin to assign your public username.
            </p>
          )}
          {member?.username && (
            <Link href={`/members/${member.username}`}>
              View public profile
            </Link>
          )}
          <Link href="/portal">Dashboard</Link>
          <Link href="/portal/projects/new">New project</Link>
          <Link href="/portal/devlogs/new">New devlog</Link>
          {isAdmin(session) && <Link href="/admin">Admin</Link>}
          <a href="/api/auth/logout" style={{ color: 'var(--red)' }}>
            Sign out
          </a>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
