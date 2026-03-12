'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactPage() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')

    const form = event.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      form.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
      <div className="card stack" style={{ maxWidth: 720 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0.75rem' }}>Contact</h1>
          <p style={{ color: 'var(--muted)', maxWidth: 620 }}>
            Questions, sponsorship interest, event ideas, or something you want the club to build? Send a message.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          <input name="name" placeholder="Your name" required className="field" />
          <input name="email" type="email" placeholder="Your email" required className="field" />
          <textarea name="message" placeholder="Your message" required rows={7} className="field" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
            {status === 'sent' && <span style={{ color: 'var(--green)' }}>Message sent.</span>}
            {status === 'error' && <span style={{ color: 'var(--red)' }}>Message failed. Check SMTP config and try again.</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
