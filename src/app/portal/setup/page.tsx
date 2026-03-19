import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildDefaultUsername } from '@/lib/member-username'

const errorMessages: Record<string, string> = {
  invalid: 'That username is not valid. Use only lowercase letters and numbers.',
  taken: 'That username is already taken. Pick a different one.',
  missing: 'Enter a username before continuing.',
}

export default async function PortalSetupPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: {
      name: true,
      username: true,
    },
  })

  if (!member) {
    redirect('/')
  }

  if (member.username) {
    redirect('/portal')
  }

  const params = await searchParams
  const errorCode = typeof params?.error === 'string' ? params.error : ''
  const suggested = buildDefaultUsername(member.name) ?? 'member'

  return (
    <div className='stack'>
      <section
        className='card animate-up'
        style={{
          maxWidth: 640,
          marginInline: 'auto',
          background:
            'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(236, 55, 80, 0.06) 0%, var(--surface) 60%)',
        }}
      >
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
          {'// SET USERNAME'}
        </p>
        <h1
          className='glow-red'
          style={{
            marginBottom: '0.5rem',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '-0.02em',
          }}
        >
          Choose your member URL.
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
          Your public profile will live at <span style={{ color: 'var(--orange)' }}>/members/USERNAME</span>.
          We try to use first plus last name automatically, but yours needs a manual pick.
        </p>

        {errorMessages[errorCode] && (
          <div
            className='surface'
            style={{
              padding: '0.9rem 1rem',
              borderColor: 'rgba(236, 55, 80, 0.3)',
            }}
          >
            <p style={{ margin: 0, color: 'var(--red)', fontWeight: 700 }}>
              {errorMessages[errorCode]}
            </p>
          </div>
        )}

        <form action='/api/profile/username' method='post' className='stack'>
          <label className='stack' style={{ gap: '0.45rem' }}>
            <span
              style={{
                color: 'var(--muted)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Username
            </span>
            <input
              name='username'
              defaultValue={suggested}
              className='field'
              autoCapitalize='none'
              autoCorrect='off'
              spellCheck={false}
              placeholder='alexradu'
            />
          </label>

          <div
            className='surface'
            style={{
              padding: '0.9rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>Rules</p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Use lowercase letters and numbers only. Spaces and punctuation get removed.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type='submit' className='btn-primary'>
              Save username →
            </button>
            <Link href='/api/auth/logout' className='btn-outline'>
              Sign out
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
