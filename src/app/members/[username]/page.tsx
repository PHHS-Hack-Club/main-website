import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MarkdownPreview from '@/components/MarkdownPreview'
import ProfileEditor from '@/components/ProfileEditor'
import { getSession } from '@/lib/auth'
import { getFileUrl } from '@/lib/minio'
import {
  fetchTotalSeconds,
  formatSeconds,
  getMemberInitials,
  roleColor,
  roleLabel,
} from '@/lib/member-display'
import { prisma } from '@/lib/prisma'

const joinedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

function previewText(value: string, maxLength: number): string {
  const normalized = value.trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

function MemberAvatar({
  name,
  profilePictureUrl,
  size,
  borderColor = 'rgba(255,255,255,0.14)',
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
        alt={`${name}'s profile picture`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 18px 40px rgba(0, 0, 0, 0.24)',
          background: 'var(--raised)',
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
        display: 'grid',
        placeItems: 'center',
        fontSize: size >= 96 ? '1.35rem' : '1rem',
        fontWeight: 800,
        color: 'var(--dim)',
        fontFamily: 'var(--font-mono)',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.24)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%), var(--raised)',
      }}
    >
      {getMemberInitials(name)}
    </div>
  )
}

function HeroBackdrop({
  headshotUrl,
  accent,
}: {
  headshotUrl: string | null
  accent: { color: string }
}) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: 260,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: headshotUrl
          ? `center / cover no-repeat url(${headshotUrl})`
          : `radial-gradient(circle at 18% 24%, ${accent.color}1f 0%, transparent 36%), linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%), var(--surface)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(8,8,12,0.12) 0%, rgba(8,8,12,0.42) 42%, rgba(8,8,12,0.92) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(circle at 16% 22%, ${accent.color}28 0%, transparent 32%), radial-gradient(circle at 82% 12%, rgba(255,255,255,0.12) 0%, transparent 22%)`,
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          bottom: 0,
          height: 120,
          background:
            'linear-gradient(180deg, rgba(8,8,12,0) 0%, rgba(8,8,12,0.92) 100%)',
        }}
      />
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params

  const member = await prisma.member.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
      headline: true,
      bio: true,
      headshotKey: true,
      projects: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          title: true,
          images: {
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { minioKey: true },
          },
        },
      },
    },
  })

  if (!member) return { title: 'Member · PHHS Hack Club' }

  const latestProject = member.projects[0]
  const title = `${member.name} · PHHS Hack Club`
  const description = (member.bio ||
    member.headline ||
    (latestProject?.title
      ? `${member.name}'s projects and devlogs at PHHS Hack Club, including ${latestProject.title}.`
      : `${member.name}'s member page at PHHS Hack Club.`)).slice(0, 160)
  const image = latestProject?.images[0]
    ? getFileUrl(latestProject.images[0].minioKey)
    : member.headshotKey
      ? getFileUrl(member.headshotKey)
      : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const session = await getSession()
  const { username } = await params

  const member = await prisma.member.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      headline: true,
      bio: true,
      role: true,
      profilePictureKey: true,
      headshotKey: true,
      hackatimeToken: true,
      websiteUrl: true,
      githubUrl: true,
      createdAt: true,
      _count: {
        select: {
          projects: { where: { status: 'APPROVED' } },
          devlogs: { where: { status: 'APPROVED' } },
        },
      },
      projects: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          images: {
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: {
              minioKey: true,
              originalFilename: true,
            },
          },
        },
      },
      devlogs: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          body: true,
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  })

  if (!member) notFound()

  const isOwner = session?.memberId === member.id
  const totalSeconds = member.hackatimeToken
    ? await fetchTotalSeconds(member.hackatimeToken)
    : 0
  const rc = roleColor[member.role]
  const profilePictureUrl = member.profilePictureKey
    ? getFileUrl(member.profilePictureKey)
    : null
  const headshotUrl = member.headshotKey ? getFileUrl(member.headshotKey) : null

  return (
    <div
      className='container'
      style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}
    >
      <div className='stack'>
        <Link
          href='/members'
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: 'var(--muted)',
            fontSize: '0.82rem',
            fontWeight: 'bold',
          }}
        >
          ← Members
        </Link>

        <section
          className='card animate-up'
          style={{
            padding: 0,
            overflow: 'hidden',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%), var(--surface)',
          }}
        >
          <HeroBackdrop headshotUrl={headshotUrl} accent={rc} />

          <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
            <div
              style={{
                marginTop: -64,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                <MemberAvatar
                  name={member.name}
                  profilePictureUrl={profilePictureUrl}
                  size={128}
                />

                <div style={{ paddingBottom: '0.35rem' }}>
                  <p
                    style={{
                      margin: '0 0 0.45rem',
                      color: 'rgba(255,255,255,0.72)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.14em',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {'// MEMBER'}
                  </p>
                  <h1
                    className='glow-red'
                    style={{
                      marginBottom: '0.35rem',
                      letterSpacing: '-0.03em',
                      fontSize: 'clamp(2.3rem, 4vw, 3.8rem)',
                    }}
                  >
                    {member.name}
                  </h1>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--muted)',
                      fontSize: '0.92rem',
                    }}
                  >
                    {`Joined ${joinedDateFormatter.format(member.createdAt)} · ${member.username}`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {isOwner && (
                  <ProfileEditor
                    mode='modal'
                    name={member.name}
                    currentImageUrl={profilePictureUrl}
                    currentHeadshotUrl={headshotUrl}
                    triggerLabel='Edit'
                    triggerClassName='btn-ghost'
                    initialValues={{
                      headline: member.headline ?? '',
                      bio: member.bio ?? '',
                      websiteUrl: member.websiteUrl ?? '',
                      githubUrl: member.githubUrl ?? '',
                    }}
                  />
                )}

                <span
                  style={{
                    display: 'inline-flex',
                    padding: '0.34rem 0.8rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.75rem',
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
            </div>

            {member.headline && (
              <p
                style={{
                  margin: '1rem 0 0',
                  maxWidth: 760,
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: '1rem',
                  lineHeight: 1.7,
                }}
              >
                {member.headline}
              </p>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.8rem',
                marginTop: '1.4rem',
              }}
            >
              <div
                className='surface'
                style={{
                  padding: '0.95rem 1rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 0.18rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.2rem',
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
                  approved projects
                </p>
              </div>

              <div
                className='surface'
                style={{
                  padding: '0.95rem 1rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 0.18rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.2rem',
                  }}
                >
                  {member._count.devlogs}
                </p>
                <p
                  style={{
                    margin: 0,
                    color: 'var(--dim)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  approved devlogs
                </p>
              </div>

              {totalSeconds > 0 && (
                <div
                  className='surface'
                  style={{
                    padding: '0.95rem 1rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 0.18rem',
                      color: 'var(--orange)',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.2rem',
                    }}
                  >
                    {formatSeconds(totalSeconds)}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--dim)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    logged in Hackatime
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {(member.bio || member.websiteUrl || member.githubUrl) && (
          <section className='card stack animate-up'>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ maxWidth: 720 }}>
                <p
                  style={{
                    margin: '0 0 0.4rem',
                    color: 'var(--muted)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.12em',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {'// ABOUT'}
                </p>
                {member.bio ? (
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--muted)',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {member.bio}
                  </p>
                ) : (
                  <p style={{ margin: 0, color: 'var(--muted)' }}>No bio added yet.</p>
                )}
              </div>

              {(member.websiteUrl || member.githubUrl) && (
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {member.websiteUrl && (
                    <a
                      href={member.websiteUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='btn-outline'
                      style={{ minHeight: 38 }}
                    >
                      Website ↗
                    </a>
                  )}
                  {member.githubUrl && (
                    <a
                      href={member.githubUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='btn-outline'
                      style={{ minHeight: 38 }}
                    >
                      GitHub ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <section className='stack'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.15rem', letterSpacing: '0.01em' }}>
              Projects
            </h2>
            <span
              style={{
                color: 'var(--dim)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {member.projects.length} approved
            </span>
          </div>

          {member.projects.length === 0 ? (
            <div className='card' style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No approved projects yet.</p>
            </div>
          ) : (
            <div className='grid-cards'>
              {member.projects.map((project) => {
                const image = project.images[0]

                return (
                  <Link
                    key={project.id}
                    href={`/gallery/${project.id}`}
                    className='card card-interactive stack'
                    style={{ padding: 0, overflow: 'hidden', textDecoration: 'none' }}
                  >
                    {image ? (
                      <img
                        src={getFileUrl(image.minioKey)}
                        alt={image.originalFilename}
                        style={{ width: '100%', height: 180, objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          height: 100,
                          background: 'var(--raised)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--dim)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                          }}
                        >
                          NO_SCREENSHOT
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        padding: '0.65rem var(--space-3) var(--space-3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                        flex: 1,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            marginTop: 0,
                            marginBottom: '0.25rem',
                            fontSize: '1.05rem',
                          }}
                        >
                          {project.title || 'Untitled project'}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                          {project.description
                            ? previewText(project.description, 120)
                            : 'No description provided.'}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          marginTop: 'auto',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.35rem',
                          }}
                        >
                          {project.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--muted)',
                                background: 'var(--raised)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.15rem 0.45rem',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span
                          style={{
                            color: 'var(--orange)',
                            margin: 0,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View project →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section className='stack'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.15rem', letterSpacing: '0.01em' }}>
              Devlogs
            </h2>
            <span
              style={{
                color: 'var(--dim)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {member.devlogs.length} approved
            </span>
          </div>

          {member.devlogs.length === 0 ? (
            <div className='card' style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No approved devlogs yet.</p>
            </div>
          ) : (
            <div className='stack'>
              {member.devlogs.map((devlog) => (
                <article key={devlog.id} className='card stack'>
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '1rem' }}>
                      {devlog.title || 'Untitled devlog'}
                    </h3>
                    <p
                      style={{
                        color: 'var(--muted)',
                        margin: 0,
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {devlog.project ? (
                        <Link
                          href={`/gallery/${devlog.project.id}`}
                          style={{ color: 'var(--orange)' }}
                        >
                          {devlog.project.title || 'Untitled project'}
                        </Link>
                      ) : (
                        'Independent devlog'
                      )}
                    </p>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                    <MarkdownPreview
                      source={previewText(devlog.body, 220)}
                      fallback='No content provided.'
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
