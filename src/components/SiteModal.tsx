'use client'

import { useEffect, useState } from 'react'

interface ActiveModal {
  id: string
  heading: string
  body: string
}

export default function SiteModal() {
  const [modal, setModal] = useState<ActiveModal | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/modals/active')
      .then((r) => r.json())
      .then((data: ActiveModal | null) => {
        if (!data) return
        const key = `modal-seen-${data.id}`
        if (sessionStorage.getItem(key)) return
        setModal(data)
        setVisible(true)
      })
      .catch(() => {})
  }, [])

  function dismiss() {
    if (modal) sessionStorage.setItem(`modal-seen-${modal.id}`, '1')
    setVisible(false)
  }

  if (!visible || !modal) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div
        className="card stack animate-up"
        style={{
          maxWidth: 480,
          width: '100%',
          padding: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* red top bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--red), #ff6b35)' }} />

        <div style={{ padding: 'var(--space-4)' }} className="stack">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <p style={{
                margin: '0 0 0.4rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--red)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
              }}>
                {'// PHHS CODING CLUB'}
              </p>
              <h2 className="glow-red" style={{ margin: 0, fontSize: 'clamp(1.25rem, 4vw, 1.6rem)', lineHeight: 1.2 }}>
                {modal.heading}
              </h2>
            </div>
            <button
              type="button"
              onClick={dismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                lineHeight: 1,
                padding: '0.1rem 0.25rem',
                flexShrink: 0,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {modal.body}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-primary" onClick={dismiss}>
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
