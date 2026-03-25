'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ProfileHeadshotUpload from '@/components/ProfileHeadshotUpload'
import ProfilePictureUpload from '@/components/ProfilePictureUpload'

type ProfileValues = {
  headline: string
  bio: string
  websiteUrl: string
  githubUrl: string
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

export default function ProfileEditor({
  initialValues,
  mode = 'inline',
  name,
  currentImageUrl = null,
  currentHeadshotUrl = null,
  triggerLabel = 'Edit',
  triggerClassName = 'btn-outline',
}: {
  initialValues: ProfileValues
  mode?: 'inline' | 'modal'
  name?: string
  currentImageUrl?: string | null
  currentHeadshotUrl?: string | null
  triggerLabel?: string
  triggerClassName?: string
}) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

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

  const editorContent = (
    <form onSubmit={handleSubmit} className='stack' style={{ gap: '1rem' }}>
      {name && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            className='surface'
            style={{
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <ProfilePictureUpload currentUrl={currentImageUrl} name={name} />
            <div style={{ maxWidth: 360 }}>
              <p style={{ margin: '0 0 0.2rem', fontWeight: 700 }}>Profile picture</p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                Small circular avatar shown across the site.
              </p>
            </div>
          </div>

          <div className='surface stack' style={{ padding: '1rem', gap: '0.8rem' }}>
            <div>
              <p style={{ margin: '0 0 0.2rem', fontWeight: 700 }}>Headshot backdrop</p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                Wide photo used behind your profile icon on member pages and team cards.
              </p>
            </div>
            <ProfileHeadshotUpload currentUrl={currentHeadshotUrl} name={name} />
          </div>
        </div>
      )}

      <div className='stack' style={{ gap: '0.75rem' }}>
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
  )

  if (mode === 'modal') {
    const modal = (
      <AnimatePresence>
        {open && (
          <motion.div
            key='profile-modal-overlay'
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(8, 6, 12, 0.8)',
              backdropFilter: 'blur(6px)',
              display: 'grid',
              placeItems: 'center',
              padding: 'clamp(0.75rem, 2vw, 1.25rem)',
              overflowY: 'auto',
              zIndex: 1200,
            }}
          >
            <motion.section
              key='profile-modal-panel'
              role='dialog'
              aria-modal='true'
              aria-label='Edit your member page'
              className='card'
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: 'min(680px, calc(100vw - 1.5rem))',
                maxHeight: 'min(860px, calc(100dvh - 1.5rem))',
                margin: 'auto',
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transformOrigin: 'center center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '1rem 1rem 0.9rem',
                  borderBottom: '1px solid var(--border)',
                  background: 'rgba(22, 20, 31, 0.96)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Edit profile</h2>
                <button type='button' className='btn-ghost' onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>

              <div
                className='stack'
                style={{
                  padding: '1rem',
                  gap: '1rem',
                  overflowY: 'auto',
                  minHeight: 0,
                }}
              >
                {editorContent}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    )

    return (
      <>
        <button type='button' className={triggerClassName} onClick={() => setOpen(true)}>
          {triggerLabel}
        </button>
        {mounted ? createPortal(modal, document.body) : null}
      </>
    )
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
      {editorContent}
    </section>
  )
}
