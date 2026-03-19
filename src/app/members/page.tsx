import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'
import {
  fetchTotalSeconds,
  formatSeconds,
  getMemberInitials,
  roleColor,
  roleLabel,
  roleOrder,
} from '@/lib/member-display'

export default async function MembersPage() {
  const members = await prisma.member.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      hackatimeToken: true,
      profilePictureKey: true,
      _count: { select: { projects: { where: { status: 'APPROVED' } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const rows = await Promise.all(
    members.map(async (m) => ({
      ...m,
      totalSeconds: m.hackatimeToken
        ? await fetchTotalSeconds(m.hackatimeToken)
        : 0,
    }))
  )

  rows.sort((a, b) => {
    const roleDiff = roleOrder[a.role] - roleOrder[b.role]
    if (roleDiff !== 0) return roleDiff
    return b.totalSeconds - a.totalSeconds
  })

  return (
    <div
      className='container'
      style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}
    >
      <div className='stack'>
        <div className='animate-up'>
          <p
            style={{
              margin: '0 0 0.5rem',
              color: 'var(--muted)',
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}
          > 
            {'// MEMBERS'}
          </p>
          <h1
            className='glow-red'
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Who we are.
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
            {rows.length} members building things at PHHS.
          </p>
        </div>

        <div className='grid-cards'>
          {rows.map((member, i) => {
            const rc = roleColor[member.role]
            const content = (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {member.profilePictureKey ? (
                      <img
                        src={getFileUrl(member.profilePictureKey)}
                        alt=""
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--raised)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: 'var(--dim)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {getMemberInitials(member.name)}
                      </div>
                    )}
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1rem' }}>{member.name}</h2>
                      {member.username && (
                        <p
                          style={{
                            margin: '0.15rem 0 0',
                            color: 'var(--dim)',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {`/members/${member.username}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      border: `1px solid ${rc.border}`,
                      color: rc.color,
                      background: rc.bg,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {roleLabel[member.role]}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
                  <div>
                    <p
                      style={{
                        margin: '0 0 0.2rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.1rem',
                      }}
                    >
                      {member._count.projects}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--dim)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      projects
                    </p>
                  </div>
                  {member.totalSeconds > 0 && (
                    <div>
                      <p
                        style={{
                          margin: '0 0 0.2rem',
                          color: 'var(--orange)',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.1rem',
                        }}
                      >
                        {formatSeconds(member.totalSeconds)}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          color: 'var(--dim)',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        coded
                      </p>
                    </div>
                  )}
                </div>
                <p
                  style={{
                    margin: '1rem 0 0',
                    color: member.username ? 'var(--orange)' : 'var(--muted)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {member.username ? 'View member →' : 'Profile URL pending'}
                </p>
              </>
            )

            return member.username ? (
              <Link
                key={member.id}
                href={`/members/${member.username}`}
                className='card card-interactive animate-up'
                style={{
                  animationDelay: `${0.05 * i}s`,
                  textDecoration: 'none',
                }}
              >
                {content}
              </Link>
            ) : (
              <article
                key={member.id}
                className='card animate-up'
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                {content}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
