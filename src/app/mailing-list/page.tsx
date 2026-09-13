'use client'

import { useState, useRef } from 'react'

export default function MailingListPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/mailing-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), schoolEmail: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong')
        setState('error')
        return
      }
      setState('success')
      setName('')
      setEmail('')
      // Reset back to idle after 2.5s so next person can sign up
      setTimeout(() => {
        setState('idle')
        nameRef.current?.focus()
      }, 2500)
    } catch {
      setErrorMsg('Network error — try again')
      setState('error')
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 480, padding: '2rem' }}>
      {state === 'success' ? (
        <div style={{ textAlign: 'center', animation: 'fadeUp 0.3s ease' }}>
          <div
            style={{
              fontSize: '3.5rem',
              marginBottom: '0.75rem',
              lineHeight: 1,
            }}
          >
            ✓
          </div>
          <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text)', fontSize: '1.5rem' }}>
            You&apos;re on the list!
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Pass it to the next person.</p>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p
              style={{
                margin: '0 0 0.4rem',
                color: 'var(--red)',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {'// PHHS CODING CLUB'}
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                letterSpacing: '-0.02em',
              }}
            >
              Join the mailing list
            </h1>
            <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
              Enter your name and school email to stay in the loop.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="stack" style={{ gap: '0.85rem' }}>
            <div>
              <label
                htmlFor="kiosk-name"
                style={{
                  display: 'block',
                  marginBottom: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Full name
              </label>
              <input
                ref={nameRef}
                id="kiosk-name"
                type="text"
                className="field"
                placeholder="Ryan Hughes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                autoComplete="off"
                style={{ fontSize: '1.1rem', padding: '0.75rem 1rem' }}
              />
            </div>

            <div>
              <label
                htmlFor="kiosk-email"
                style={{
                  display: 'block',
                  marginBottom: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                School email (@pascack.org)
              </label>
              <input
                id="kiosk-email"
                type="email"
                className="field"
                placeholder="rhughes27@pascack.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                style={{ fontSize: '1.1rem', padding: '0.75rem 1rem' }}
              />
            </div>

            {state === 'error' && (
              <p style={{ color: 'var(--red)', margin: 0, fontSize: '0.88rem' }}>{errorMsg}</p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={state === 'loading'}
              style={{ fontSize: '1rem', padding: '0.85rem', width: '100%' }}
            >
              {state === 'loading' ? 'Signing up…' : 'Sign me up'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
