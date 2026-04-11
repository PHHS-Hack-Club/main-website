import crypto from 'crypto'
import tls from 'tls'

const DEFAULT_WEBMAIL_URL = 'https://mail.phhshack.club'
const DEFAULT_IMAP_HOST = 'imap.purelymail.com'
const DEFAULT_IMAP_PORT = 993
const IMAP_VERIFY_TIMEOUT_MS = 10_000

export class MailSsoError extends Error {
  constructor(
    public readonly code:
      | 'missing_config'
      | 'network_error'
      | 'sso_handshake_failed'
      | 'invalid_credentials',
    message: string,
  ) {
    super(message)
    this.name = 'MailSsoError'
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new MailSsoError('missing_config', `${name} is not configured`)
  }
  return value
}

function readEncryptionKey(): Buffer {
  const raw = requireEnv('MAIL_SSO_ENCRYPTION_KEY')

  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex')
  }

  const base64 = raw.replace(/-/g, '+').replace(/_/g, '/')
  const normalized = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const decoded = Buffer.from(normalized, 'base64')
  if (decoded.length === 32) {
    return decoded
  }

  throw new MailSsoError(
    'missing_config',
    'MAIL_SSO_ENCRYPTION_KEY must be a 32-byte base64url or 64-char hex key',
  )
}

export function getWebmailUrl(): string {
  return process.env.WEBMAIL_URL?.trim() || DEFAULT_WEBMAIL_URL
}

function buildWebmailSsoUrl(webmailUrl: string, hash: string): string {
  return `${webmailUrl.replace(/\/+$/, '')}/?Sso&hash=${encodeURIComponent(hash)}`
}

function quoteImapString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export function encryptMailboxPassword(password: string): string {
  const key = readEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.')
}

export function decryptMailboxPassword(ciphertext: string): string {
  const [version, iv, tag, payload] = ciphertext.split('.')
  if (version !== 'v1' || !iv || !tag || !payload) {
    throw new MailSsoError('sso_handshake_failed', 'Stored mailbox credential is invalid')
  }

  const key = readEncryptionKey()
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64url'),
  )
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))

  return Buffer.concat([
    decipher.update(Buffer.from(payload, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

async function requestWebmailSsoHash(
  email: string,
  password: string,
): Promise<{ hash: string; webmailUrl: string }> {
  const ssoKey = requireEnv('SNAPPYMAIL_SSO_KEY')
  const webmailUrl = getWebmailUrl()
  const externalSsoUrl = new URL('/?/ExternalSso/', webmailUrl)

  let response: Response
  try {
    response = await fetch(externalSsoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        Email: email,
        Password: password,
        SsoKey: ssoKey,
        Output: 'json',
      }),
      cache: 'no-store',
      redirect: 'follow',
    })
  } catch {
    throw new MailSsoError('network_error', 'Failed to contact webmail')
  }

  if (!response.ok) {
    throw new MailSsoError(
      'network_error',
      `Webmail SSO endpoint returned HTTP ${response.status}`,
    )
  }

  const payload = await response.json().catch(() => null) as
    | { Result?: string | null }
    | null

  const hash = payload?.Result
  if (!hash) {
    throw new MailSsoError(
      'sso_handshake_failed',
      'SnappyMail did not return an SSO hash',
    )
  }

  return { hash, webmailUrl }
}

async function assertMailboxPasswordValid(email: string, password: string): Promise<void> {
  const host = process.env.PURELYMAIL_IMAP_HOST?.trim() || DEFAULT_IMAP_HOST
  const port = Number(process.env.PURELYMAIL_IMAP_PORT || DEFAULT_IMAP_PORT)

  if (!Number.isInteger(port) || port <= 0) {
    throw new MailSsoError('missing_config', 'PURELYMAIL_IMAP_PORT must be a valid port')
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false
    let stage: 'greeting' | 'login' = 'greeting'
    let buffer = ''

    const finish = (error?: MailSsoError) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.destroy()
      if (error) {
        reject(error)
        return
      }
      resolve()
    }

    const socket = tls.connect({
      host,
      port,
      servername: host,
      rejectUnauthorized: true,
    })

    const timer = setTimeout(() => {
      finish(new MailSsoError('network_error', 'Timed out verifying mailbox credentials'))
    }, IMAP_VERIFY_TIMEOUT_MS)

    const flushBuffer = () => {
      let lineBreakIndex = buffer.indexOf('\r\n')

      while (lineBreakIndex !== -1) {
        const line = buffer.slice(0, lineBreakIndex)
        buffer = buffer.slice(lineBreakIndex + 2)

        if (stage === 'greeting') {
          if (line.startsWith('* OK')) {
            stage = 'login'
            socket.write(`A1 LOGIN ${quoteImapString(email)} ${quoteImapString(password)}\r\n`)
          } else if (line.length > 0) {
            finish(
              new MailSsoError('network_error', 'Mail server returned an unexpected greeting'),
            )
            return
          }
        } else if (line.startsWith('A1 OK')) {
          finish()
          return
        } else if (line.startsWith('A1 NO') || line.startsWith('A1 BAD')) {
          finish(new MailSsoError('invalid_credentials', 'Mailbox password is incorrect'))
          return
        }

        lineBreakIndex = buffer.indexOf('\r\n')
      }
    }

    socket.on('error', () => {
      finish(new MailSsoError('network_error', 'Failed to connect to the mail server'))
    })

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      flushBuffer()
    })
  })
}

export async function verifyMailboxPassword(email: string, password: string): Promise<void> {
  await assertMailboxPasswordValid(email, password)
}

export async function createWebmailSsoUrl(
  email: string,
  passwordCiphertext: string,
): Promise<string> {
  const password = decryptMailboxPassword(passwordCiphertext)
  await assertMailboxPasswordValid(email, password)
  const { hash, webmailUrl } = await requestWebmailSsoHash(email, password)
  return buildWebmailSsoUrl(webmailUrl, hash)
}
