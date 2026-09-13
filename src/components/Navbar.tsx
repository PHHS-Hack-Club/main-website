'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import type { ReactNode } from 'react'

interface NavItem {
  href?: string
  label: string
  children?: { href: string; label: string; desc?: string }[]
}

const navItems: NavItem[] = [
  { href: '/gallery', label: 'Gallery' },
  {
    label: 'Community',
    children: [
      { href: '/members', label: 'Members', desc: 'Everyone building at PHHS' },
      { href: '/leaderboard', label: 'Leaderboard', desc: 'Coding hours via Hackatime' },
    ],
  },
  {
    label: 'Club',
    children: [
      { href: '/meetings', label: 'Meetings', desc: 'Full meeting schedule' },
      { href: '/events', label: 'Events', desc: 'Recurring sessions & hack nights' },
      { href: '/about', label: 'About', desc: 'What we do and why' },
      { href: '/contact', label: 'Contact', desc: 'Get in touch' },
    ],
  },
  { href: '/sponsors', label: 'Sponsors' },
]

function NavDropdownItem({
  item,
  isOpen,
  onOpen,
  onClose,
  onNavClose,
}: {
  item: NavItem
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onNavClose: () => void
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function show() {
    if (timer.current) clearTimeout(timer.current)
    onOpen()
  }

  function hide() {
    timer.current = setTimeout(onClose, 150)
  }

  return (
    <div className="nav-dropdown-wrapper" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        onClick={() => (isOpen ? onClose() : onOpen())}
        className="nav-dropdown-trigger"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isOpen ? 'var(--text)' : 'var(--muted)',
          fontWeight: 600,
          fontSize: '0.95rem',
          padding: '0.25rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontFamily: 'inherit',
          transition: 'color 120ms ease',
        }}
      >
        {item.label}
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRight: '1.5px solid currentColor',
            borderBottom: '1.5px solid currentColor',
            transform: isOpen ? 'rotate(-135deg) translateY(2px)' : 'rotate(45deg) translateY(-2px)',
            transition: 'transform 150ms ease',
            opacity: 0.55,
            marginTop: isOpen ? 3 : 0,
          }}
        />
      </button>

      {isOpen && (
        <div
          className="nav-dropdown-panel"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {item.children!.map((child, i) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => { onClose(); onNavClose() }}
              className="nav-dropdown-link"
              style={{
                display: 'block',
                padding: '0.55rem 0.75rem',
                borderRadius: '7px',
                textDecoration: 'none',
                marginBottom: i < item.children!.length - 1 ? '0.1rem' : 0,
                transition: 'background 100ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(200,190,255,0.07)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>
                {child.label}
              </span>
              {child.desc && (
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.1rem', lineHeight: 1.4 }}>
                  {child.desc}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar({ authButton }: { authButton: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

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
          minWidth: 0,
        }}
      >
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="nav-brand"
        >
          <img
            src="/logos/phhs-hack-club-logo-trans.png"
            alt="PHHS Coding Club"
            className="nav-brand-logo"
          />
          <span className="nav-brand-text">
            <span className="nav-brand-name">PHHS</span>
            <span className="nav-brand-accent">Coding Club</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((c) => !c)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
          className="nav-toggle"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-drawer ${mobileOpen ? 'open' : ''}`}>
          <div className="nav-links" style={{ gap: '1.75rem' }}>
            {navItems.map((item) =>
              item.href ? (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ) : (
                <NavDropdownItem
                  key={item.label}
                  item={item}
                  isOpen={activeDropdown === item.label}
                  onOpen={() => setActiveDropdown(item.label)}
                  onClose={() => setActiveDropdown(null)}
                  onNavClose={() => setMobileOpen(false)}
                />
              )
            )}
            <Link
              href="https://hcb.hackclub.com/donations/start/phhs-hack-club"
              className="btn-primary"
              onClick={() => setMobileOpen(false)}
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
