import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import MailRequestFormClient from './MailRequestFormClient'
import CancelRequestButton from './CancelRequestButton'

function ssoMessageFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): string | null {
  const raw = searchParams.sso
  const value = Array.isArray(raw) ? raw[0] : raw

  if (value === 'needs-password-sync') {
    return 'Webmail SSO needs your current mailbox password synced again. Update it in Mail Settings, then try the webmail button again.'
  }

  if (value === 'failed') {
    return 'Webmail SSO failed. If this keeps happening, change your mailbox password in the portal to resync it.'
  }

  if (value === 'misconfigured') {
    return 'Webmail SSO is temporarily unavailable because the site is missing required configuration.'
  }

  if (value === 'inactive') {
    return 'Webmail SSO is only available for active mailboxes.'
  }

  return null
}

export default async function MailPortalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSession()
  if (!session) redirect('/')
  const resolvedSearchParams = await searchParams
  const ssoMessage = ssoMessageFromSearchParams(resolvedSearchParams)

  // Fetch mailbox + latest email request in parallel
  const [mailbox, latestRequest] = await Promise.all([
    prisma.mailbox.findUnique({
      where: { memberId: session.memberId },
      select: {
        localPart: true,
        domain: true,
        status: true,
        createdAt: true,
        ssoPasswordCiphertext: true,
      },
    }),
    prisma.emailRequest.findFirst({
      where: { memberId: session.memberId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // State: has an active (non-deleted) mailbox
  if (mailbox && mailbox.status !== 'DELETED') {
    return (
      <MailboxActiveView
        mailbox={mailbox}
        ssoMessage={ssoMessage}
      />
    )
  }

  // State: no request yet
  if (!latestRequest) {
    return <RequestMailView memberName={session.name} />
  }

  // State: request pending
  if (latestRequest.status === 'PENDING') {
    return (
      <RequestPendingView
        localPart={latestRequest.requestedLocalPart}
        createdAt={latestRequest.createdAt}
      />
    )
  }

  // State: request rejected
  if (latestRequest.status === 'REJECTED') {
    return (
      <RequestRejectedView
        localPart={latestRequest.requestedLocalPart}
        lastError={latestRequest.lastError}
        updatedAt={latestRequest.updatedAt}
        memberName={session.name}
      />
    )
  }

  // State: approved but no active mailbox (or was deleted) → allow re-request
  return <RequestMailView memberName={session.name} />
}

// ── Sub-views ──────────────────────────────────────────────────────────────────

function RequestMailView({ memberName }: { memberName: string }) {
  return (
    <div className="stack">
      <div>
        <p style={{ color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 0.35rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
          {'// CLUB EMAIL'}
        </p>
        <h1 style={{ marginBottom: '0.35rem' }}>Get a club email</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Request a <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>@phhshack.club</span> address.
          Addresses are based on your name and must be approved by an admin.
        </p>
      </div>

      <MailRequestFormClient memberName={memberName} />
    </div>
  )
}

function RequestPendingView({ localPart, createdAt }: { localPart: string; createdAt: Date }) {
  return (
    <div className="stack">
      <h1 style={{ marginBottom: '0.35rem' }}>Club Email</h1>
      <div className="card" style={{ borderColor: 'rgba(236,55,80,0.3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f7c948', flexShrink: 0 }} />
            <strong>Request pending</strong>
          </div>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Your request for{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: '#ec3750' }}>
              {localPart}@phhshack.club
            </span>{' '}
            is waiting for admin approval. You&apos;ll get an email when it&apos;s reviewed.
          </p>
          <p style={{ color: 'var(--dim)', margin: 0, fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            submitted {createdAt.toLocaleDateString()}
          </p>
          <CancelRequestButton />
        </div>
      </div>
    </div>
  )
}

function RequestRejectedView({
  localPart,
  lastError,
  updatedAt,
  memberName,
}: {
  localPart: string
  lastError: string | null
  updatedAt: Date
  memberName: string
}) {
  return (
    <div className="stack">
      <h1 style={{ marginBottom: '0.35rem' }}>Club Email</h1>
      <div className="card" style={{ borderColor: 'rgba(236,55,80,0.3)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ec3750', flexShrink: 0 }} />
            <strong>Request not approved</strong>
          </div>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Your request for{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              {localPart}@phhshack.club
            </span>{' '}
            was not approved.
          </p>
          {lastError && (
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.88rem' }}>
              <strong style={{ color: 'var(--fg)' }}>Reason:</strong> {lastError}
            </p>
          )}
          <p style={{ color: 'var(--dim)', margin: 0, fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            reviewed {updatedAt.toLocaleDateString()}
          </p>
        </div>
      </div>

      <div>
        <p style={{ color: 'var(--muted)', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
          You can submit a new request with a different address.
        </p>
        <MailRequestFormClient memberName={memberName} />
      </div>
    </div>
  )
}

function MailboxActiveView({
  mailbox,
  ssoMessage,
}: {
  mailbox: {
    localPart: string
    domain: string
    status: string
    createdAt: Date
    ssoPasswordCiphertext: string | null
  }
  ssoMessage: string | null
}) {
  const fullAddress = `${mailbox.localPart}@${mailbox.domain}`
  const webmailUrl = 'https://mail.phhshack.club'
  const hasStoredSsoPassword = Boolean(mailbox.ssoPasswordCiphertext)

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
    PROVISIONED_AWAITING_PASSWORD: 'Setup required',
    PENDING_DELETION: 'Scheduled for deletion',
  }

  const statusColor: Record<string, string> = {
    ACTIVE: '#4ade80',
    SUSPENDED: '#ec3750',
    PROVISIONED_AWAITING_PASSWORD: '#f7c948',
    PENDING_DELETION: '#ec3750',
  }

  return (
    <div className="stack">
      <div>
        <p style={{ color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 0.35rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
          {'// CLUB EMAIL'}
        </p>
        <h1 style={{ marginBottom: '0.35rem' }}>Your club email</h1>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ssoMessage && (
            <div style={{ background: 'rgba(236,55,80,0.08)', border: '1px solid rgba(236,55,80,0.25)', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
                {ssoMessage}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#ec3750',
              }}
            >
              {fullAddress}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: statusColor[mailbox.status] ?? 'var(--muted)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: statusColor[mailbox.status] ?? 'var(--muted)' }} />
              {statusLabel[mailbox.status] ?? mailbox.status}
            </span>
          </div>

          {mailbox.status === 'PROVISIONED_AWAITING_PASSWORD' && (
            <div style={{ background: 'rgba(247,201,72,0.08)', border: '1px solid rgba(247,201,72,0.25)', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <p style={{ margin: '0 0 0.5rem', color: '#f7c948', fontSize: '0.88rem', fontWeight: 700 }}>
                Password setup required
              </p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
                Check your personal email for a setup link from PHHS Hack Club.
              </p>
            </div>
          )}

          {mailbox.status === 'SUSPENDED' && (
            <div style={{ background: 'rgba(236,55,80,0.08)', border: '1px solid rgba(236,55,80,0.25)', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
                Your mailbox is suspended. Contact an admin if you think this is a mistake.
              </p>
            </div>
          )}

          {mailbox.status === 'ACTIVE' && !hasStoredSsoPassword && (
            <div style={{ background: 'rgba(247,201,72,0.08)', border: '1px solid rgba(247,201,72,0.25)', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <p style={{ margin: '0 0 0.35rem', color: '#f7c948', fontSize: '0.88rem', fontWeight: 700 }}>
                Webmail SSO setup required
              </p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
                Change your mailbox password in the portal once. After that, the webmail button will sign you in automatically.
              </p>
            </div>
          )}

          <p style={{ color: 'var(--dim)', margin: 0, fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            created {mailbox.createdAt.toLocaleDateString()}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {mailbox.status === 'ACTIVE' && hasStoredSsoPassword && (
              <a
                href="/api/mail/sso"
                className="btn-primary"
                style={{ fontSize: '0.88rem' }}
              >
                Open webmail →
              </a>
            )}
            {mailbox.status === 'ACTIVE' && (
              <a
                href={webmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
                style={{ fontSize: '0.88rem' }}
              >
                Open direct login
              </a>
            )}
            {mailbox.status === 'ACTIVE' && (
              <Link href="/portal/mail/settings" className="btn-outline" style={{ fontSize: '0.88rem' }}>
                Change password
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--raised)' }}>
        <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
          IMAP / SMTP
        </p>
        <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.83rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          <p style={{ margin: 0 }}><span style={{ color: 'var(--dim)' }}>IMAP</span> imap.purelymail.com <span style={{ color: 'var(--dim)' }}>: 993 TLS</span></p>
          <p style={{ margin: 0 }}><span style={{ color: 'var(--dim)' }}>SMTP</span> smtp.purelymail.com <span style={{ color: 'var(--dim)' }}>: 465 SSL</span></p>
          <p style={{ margin: 0 }}><span style={{ color: 'var(--dim)' }}>user</span> {fullAddress}</p>
        </div>
      </div>
    </div>
  )
}
