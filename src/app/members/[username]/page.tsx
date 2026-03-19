import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MarkdownPreview from '@/components/MarkdownPreview'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'
import {
  fetchTotalSeconds,
  formatSeconds,
  getMemberInitials,
  roleColor,
  roleLabel,
} from '@/lib/member-display'

const joinedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

function previewText(value: string, maxLength: number): string {
  const normalized = value.trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trimEnd()}...`
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
  const description = (member.bio || member.headline || (latestProject?.title
    ? `${member.name}'s projects and devlogs at PHHS Hack Club, including ${latestProject.title}.`
    : `${member.name}'s member page at PHHS Hack Club.`)).slice(0, 160)
  const image = latestProject?.images[0] ? getFileUrl(latestProject.images[0].minioKey) : undefined

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

  const totalSeconds = member.hackatimeToken
    ? await fetchTotalSeconds(member.hackatimeToken)
    : 0
  const rc = roleColor[member.role]

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
            background:
              'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(236, 55, 80, 0.06) 0%, var(--surface) 60%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {member.profilePictureKey ? (
                <img
                  src={getFileUrl(member.profilePictureKey)}
                  alt={`${member.name}'s profile picture`}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid var(--border)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--raised)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: 'var(--dim)',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {getMemberInitials(member.name)}
                </div>
              )}

              <div>
                <p
                  style={{
                    margin: '0 0 0.35rem',
                    color: 'var(--muted)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.12em',
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
                    letterSpacing: '-0.02em',
                    fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  }}
                >
                  {member.name}
                </h1>
                <p
                  style={{
                    margin: 0,
                    color: 'var(--muted)',
                    fontSize: '0.9rem',
                  }}
                >
                  {`Joined ${joinedDateFormatter.format(member.createdAt)} · /members/${member.username}`}
                </p>
                {member.headline && (
                  <p
                    style={{
                      margin: '0.6rem 0 0',
                      color: 'var(--text)',
                      fontSize: '1rem',
                      maxWidth: 640,
                    }}
                  >
                    {member.headline}
                  </p>
                )}
              </div>
            </div>

            <span
              style={{
                display: 'inline-flex',
                padding: '0.3rem 0.75rem',
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

          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              flexWrap: 'wrap',
              marginTop: '1.5rem',
            }}
          >
            <div>
              <p
                style={{
                  margin: '0 0 0.2rem',
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

            <div>
              <p
                style={{
                  margin: '0 0 0.2rem',
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
              <div>
                <p
                  style={{
                    margin: '0 0 0.2rem',
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
                  total coded
                </p>
              </div>
            )}
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
                  <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {member.bio}
                  </p>
                ) : (
                  <p style={{ margin: 0, color: 'var(--muted)' }}>
                    No bio added yet.
                  </p>
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
