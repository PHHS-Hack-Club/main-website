import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MailSsoError, createWebmailSsoUrl } from '@/lib/mail-sso'

function getSiteOrigin() {
  return process.env.NEXT_PUBLIC_URL || 'https://phhshack.club'
}

function portalRedirect(request: NextRequest, reason: string) {
  const url = new URL('/portal/mail', getSiteOrigin())
  url.searchParams.set('sso', reason)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(
      new URL('/api/auth/login?return=/api/mail/sso', getSiteOrigin()),
    )
  }

  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite === 'cross-site') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const mailbox = await prisma.mailbox.findUnique({
    where: { memberId: session.memberId },
    select: {
      localPart: true,
      domain: true,
      status: true,
      ssoPasswordCiphertext: true,
    },
  })

  if (!mailbox || mailbox.status !== 'ACTIVE') {
    return portalRedirect(request, 'inactive')
  }

  if (!mailbox.ssoPasswordCiphertext) {
    return portalRedirect(request, 'needs-password-sync')
  }

  try {
    const loginUrl = await createWebmailSsoUrl(
      `${mailbox.localPart}@${mailbox.domain}`,
      mailbox.ssoPasswordCiphertext,
    )
    return NextResponse.redirect(loginUrl)
  } catch (error) {
    const reason =
      error instanceof MailSsoError && error.code === 'invalid_credentials'
        ? 'needs-password-sync'
        :
      error instanceof MailSsoError && error.code === 'missing_config'
        ? 'misconfigured'
        : 'failed'
    return portalRedirect(request, reason)
  }
}
