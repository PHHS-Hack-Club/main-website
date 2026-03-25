import Link from 'next/link'
import type { Role } from '@prisma/client'
import { getFileUrl } from '@/lib/minio'
import {
  fetchTotalSeconds,
  formatSeconds,
  getMemberInitials,
  roleColor,
  roleLabel,
  roleOrder,
} from '@/lib/member-display'
import { prisma } from '@/lib/prisma'

interface MemberRow {
  id: string
  username: string | null
  name: string
  role: Role
  headline: string | null
  hackatimeToken: string | null
  profilePictureKey: string | null
  headshotKey: string | null
  _count: {
    projects: number
  }
  totalSeconds: number
}

function MemberAvatar({
  name,
  profilePictureUrl,
  size,
  borderColor = 'rgba(255,255,255,0.12)',
}: {
  name: string
  profilePictureUrl: string | null
  size: number
  borderColor?: string
}) {
  if (profilePictureUrl) {
    return (
      <img
        src={profilePictureUrl}
        alt=''
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 16px 32px rgba(0,0,0,0.2)',
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%), var(--raised)',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        fontSize: size >= 64 ? '1rem' : '0.78rem',
        fontWeight: 800,
        color: 'var(--dim)',
        fontFamily: 'var(--font-mono)',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 16px 32px rgba(0,0,0,0.2)',
      }}
    >
      {getMemberInitials(name)}
    </div>
  )
}

function MemberCard({
  member,
  featured = false,
  animationDelay = '0s',
}: {
  member: MemberRow
  featured?: boolean
  animationDelay?: string
}) {
  const rc = roleColor[member.role]
  const profilePictureUrl = member.profilePictureKey
    ? getFileUrl(member.profilePictureKey)
    : null
  const avatarSize = featured ? 86 : 64

  const content = (
    <>
      <div style={{ padding: featured ? '1.15rem' : '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: 0 }}>
            <MemberAvatar
              name={member.name}
              profilePictureUrl={profilePictureUrl}
              size={avatarSize}
            />

            <div style={{ minWidth: 0, paddingTop: featured ? '0.4rem' : '0.25rem' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: featured ? '1.18rem' : '0.98rem',
                  lineHeight: 1.15,
                }}
              >
                {member.name}
              </h2>
              {member.username && (
                <p
                  style={{
                    margin: '0.2rem 0 0',
                    color: 'var(--dim)',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
              padding: featured ? '0.3rem 0.76rem' : '0.22rem 0.62rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: featured ? '0.72rem' : '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: `1px solid ${rc.border}`,
              color: rc.color,
              background: rc.bg,
              whiteSpace: 'nowrap',
              marginTop: '0.35rem',
            }}
          >
            {roleLabel[member.role]}
          </span>
        </div>

        {member.headline && (
          <p
            style={{
              margin: featured ? '0.95rem 0 0' : '0.8rem 0 0',
              color: 'var(--muted)',
              fontSize: featured ? '0.92rem' : '0.86rem',
              lineHeight: 1.65,
            }}
          >
            {member.headline}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: featured ? '1.3rem' : '1rem',
            alignItems: 'flex-end',
            marginTop: featured || member.headline ? '1rem' : '0.8rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 0.18rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                fontSize: featured ? '1.2rem' : '1.05rem',
              }}
            >
              {member._count.projects}
            </p>
            <p
              style={{
                margin: 0,
                color: 'var(--dim)',
                fontSize: '0.74rem',
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
                  margin: '0 0 0.18rem',
                  color: 'var(--orange)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  fontSize: featured ? '1.2rem' : '1.05rem',
                }}
              >
                {formatSeconds(member.totalSeconds)}
              </p>
              <p
                style={{
                  margin: 0,
                  color: 'var(--dim)',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                logged
              </p>
            </div>
          )}
        </div>

        <p
          style={{
            margin: featured ? '1.05rem 0 0' : '0.95rem 0 0',
            color: member.username ? 'var(--orange)' : 'var(--muted)',
            fontSize: featured ? '0.84rem' : '0.8rem',
            fontWeight: 700,
          }}
        >
          {member.username ? 'View member →' : 'Profile URL pending'}
        </p>
      </div>
    </>
  )

  const commonStyle = {
    animationDelay,
    textDecoration: 'none',
    overflow: 'hidden',
    padding: 0,
    background:
      featured && member.role === 'PRESIDENT'
        ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%), var(--surface)'
        : featured && member.role === 'VP'
          ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%), var(--surface)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0) 100%), var(--surface)',
    borderColor: featured ? `${rc.color}24` : undefined,
  }

  if (member.username) {
    return (
      <Link
        href={`/members/${member.username}`}
        className={`card ${featured ? '' : 'card-interactive'} animate-up`}
        style={commonStyle}
      >
        {content}
      </Link>
    )
  }

  return (
    <article className='card animate-up' style={commonStyle}>
      {content}
    </article>
  )
}

export default async function MembersPage() {
  const members = await prisma.member.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      headline: true,
      hackatimeToken: true,
      profilePictureKey: true,
      headshotKey: true,
      _count: { select: { projects: { where: { status: 'APPROVED' } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const rows: MemberRow[] = await Promise.all(
    members.map(async (member) => ({
      ...member,
      totalSeconds: member.hackatimeToken
        ? await fetchTotalSeconds(member.hackatimeToken)
        : 0,
    }))
  )

  rows.sort((a, b) => {
    const roleDiff = roleOrder[a.role] - roleOrder[b.role]
    if (roleDiff !== 0) return roleDiff
    return b.totalSeconds - a.totalSeconds
  })

  const team = rows.filter((member) => member.role !== 'MEMBER')
  const membersOnly = rows.filter((member) => member.role === 'MEMBER')

  return (
    <div
      className='container'
      style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}
    >
      <div className='stack' style={{ gap: '1.25rem' }}>
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
              {rows.length} members building things at PHHS.
            </p>
            {team.length > 0 && (
              <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
                {team.length} leading the club.
              </p>
            )}
            <Link
              href='/leaderboard'
              style={{ color: 'var(--orange)', fontSize: '0.85rem', fontWeight: 700 }}
            >
              Leaderboard →
            </Link>
          </div>
        </div>

        {team.length > 0 && (
          <section className='stack' style={{ gap: '0.9rem' }}>
            <div>
              <p
                style={{
                  margin: '0 0 0.35rem',
                  color: 'var(--muted)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.12em',
                }}
              >
                {'// TEAM'}
              </p>
              <h2 style={{ margin: 0, fontSize: '1.7rem', letterSpacing: '-0.03em' }}>
                Club officers
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              {team.map((member, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  featured
                  animationDelay={`${0.05 * index}s`}
                />
              ))}
            </div>
          </section>
        )}

        <section className='stack' style={{ gap: '0.9rem' }}>
          <div>
            <p
              style={{
                margin: '0 0 0.35rem',
                color: 'var(--muted)',
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.12em',
              }}
            >
              {team.length > 0 ? '// MEMBERS' : '// TEAM'}
            </p>
            <h2 style={{ margin: 0, fontSize: '1.7rem', letterSpacing: '-0.03em' }}>
              {team.length > 0 ? 'Everyone building at PHHS' : 'The club'}
            </h2>
          </div>

          <div className='grid-cards'>
            {(team.length > 0 ? membersOnly : rows).map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                animationDelay={`${0.04 * index}s`}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
