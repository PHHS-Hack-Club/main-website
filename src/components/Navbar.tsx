'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ReactNode } from 'react'

const links = [
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/members', label: 'Members' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar({ authButton }: { authButton: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        background: 'rgba(14, 12, 20, 0.96)',
        borderBottom: '1px solid rgba(200, 190, 255, 0.09)',
        boxShadow: '0 1px 0 rgba(200, 190, 255, 0.04)',
      }}
    >
      <nav
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.875rem',
          paddingBottom: '0.875rem',
          gap: '1rem',
        }}
      >
        <Link
          href="/"
          onClick={() => setOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: 'var(--text)',
            fontWeight: 'bold',
            fontSize: '1rem',
            textDecoration: 'none',
            letterSpacing: '0.03em',
            transition: 'opacity 120ms ease',
          }}
        >
          <img
            src="/logos/phhs-hack-club-logo-trans.png"
            alt="PHHS Hack Club"
            style={{ width: 38, height: 38, objectFit: 'contain' }}
          />
          <span>PHHS<span style={{ color: 'var(--red)', marginLeft: '0.3em' }}>Hack Club</span></span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label="Toggle navigation"
          className="nav-toggle"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-drawer ${open ? 'open' : ''}`}>
          <div className="nav-links">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link
              href="https://hcb.hackclub.com/donations/start/phhs-hack-club"
              className="btn-primary"
              onClick={() => setOpen(false)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Donate
            </Link>
            {authButton}
          </div>
        </div>
      </nav>
    </header>
  )
}
