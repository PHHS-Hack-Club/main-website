'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ProfileValues = {
  username: string
  headline: string
  bio: string
  websiteUrl: string
  githubUrl: string
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

export default function ProfileEditor({
  initialValues,
}: {
  initialValues: ProfileValues
}) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('saving')
    setError('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setValues({
        username: data.username ?? '',
        headline: data.headline ?? '',
        bio: data.bio ?? '',
        websiteUrl: data.websiteUrl ?? '',
        githubUrl: data.githubUrl ?? '',
      })
      setStatus('saved')
      router.refresh()
    } catch (nextError) {
      setStatus('error')
      setError(nextError instanceof Error ? nextError.message : 'Failed to update profile')
    }
  }

  function updateField<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    if (status !== 'idle') setStatus('idle')
    if (error) setError('')
  }

  return (
    <section className='card stack'>
      <div>
        <p
          style={{
            color: 'var(--muted)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            margin: '0 0 0.35rem',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {'// PUBLIC PROFILE'}
        </p>
        <h2 style={{ marginBottom: '0.5rem' }}>Edit your member page</h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Update the info that appears on your public member page.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='stack'>
        <div className='stack' style={{ gap: '0.75rem' }}>
          <label className='stack' style={{ gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Username
            </span>
            <input
              className='field'
              value={values.username}
              onChange={(event) => updateField('username', event.target.value.toLowerCase())}
              autoCapitalize='none'
              autoCorrect='off'
              spellCheck={false}
              placeholder='alexradu'
            />
          </label>

          <label className='stack' style={{ gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Headline
            </span>
            <input
              className='field'
              value={values.headline}
              onChange={(event) => updateField('headline', event.target.value)}
              maxLength={80}
              placeholder='Building weird web tools and shipping club projects'
            />
          </label>

          <label className='stack' style={{ gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Bio
            </span>
            <textarea
              className='field'
              value={values.bio}
              onChange={(event) => updateField('bio', event.target.value)}
              maxLength={600}
              rows={6}
              placeholder='What you build, what you care about, and what you want people to know.'
            />
          </label>

          <label className='stack' style={{ gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Website
            </span>
            <input
              className='field'
              value={values.websiteUrl}
              onChange={(event) => updateField('websiteUrl', event.target.value)}
              autoCapitalize='none'
              autoCorrect='off'
              spellCheck={false}
              placeholder='https://your-site.com'
            />
          </label>

          <label className='stack' style={{ gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              GitHub
            </span>
            <input
              className='field'
              value={values.githubUrl}
              onChange={(event) => updateField('githubUrl', event.target.value)}
              autoCapitalize='none'
              autoCorrect='off'
              spellCheck={false}
              placeholder='https://github.com/yourname'
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type='submit' className='btn-primary' disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Save profile'}
          </button>
          {status === 'saved' && <span style={{ color: 'var(--green)' }}>Profile updated.</span>}
          {status === 'error' && <span style={{ color: 'var(--red)' }}>{error}</span>}
        </div>
      </form>
    </section>
  )
}
