/**
 * Purelymail API client.
 *
 * SECURITY: Passwords passed to createUser/setPassword must never be logged,
 * included in error messages, or propagated in error objects. This module
 * enforces this by catching raw errors and re-throwing generic PurelymailErrors
 * that contain only HTTP status and a server-supplied message (never request bodies).
 */

const BASE_URL = 'https://purelymail.com'
const TIMEOUT_MS = 10_000

export class PurelymailError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message)
    this.name = 'PurelymailError'
  }
}

export interface PurelymailClient {
  listUsers(): Promise<string[]>
  createUser(localPart: string, password: string): Promise<void>
  setPassword(localPart: string, newPassword: string): Promise<void>
  deleteUser(localPart: string): Promise<void>
  getUser(localPart: string): Promise<{ exists: boolean }>
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) {
    throw new Error(`${name} is not configured`)
  }
  return v
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callApi(path: string, body: unknown): Promise<unknown> {
  const token = requireEnv('PURELYMAIL_API_TOKEN')
  const url = `${BASE_URL}${path}`

  const doFetch = async (): Promise<Response> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Purelymail-Api-Token': token,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  let response: Response
  try {
    response = await doFetch()
    if (response.status >= 500) {
      await sleep(100 + Math.random() * 200)
      response = await doFetch()
    }
  } catch {
    throw new PurelymailError('network_error', 0, 'Network error contacting Purelymail')
  }

  if (response.status >= 200 && response.status < 300) {
    try {
      return await response.json()
    } catch {
      return {}
    }
  }

  let code = 'unknown_error'
  let msg = `HTTP ${response.status}`
  try {
    const parsed = (await response.json()) as { code?: string; message?: string; type?: string }
    if (parsed.code) code = parsed.code
    if (parsed.message) msg = parsed.message
  } catch {
    // ignore — use defaults above
  }
  throw new PurelymailError(code, response.status, msg)
}

export function getPurelymailClient(): PurelymailClient {
  return {
    async listUsers() {
      const res = (await callApi('/api/v0/listUser', {})) as { users?: string[] }
      return res.users ?? []
    },

    async createUser(localPart, password) {
      const domain = requireEnv('PURELYMAIL_DOMAIN')
      await callApi('/api/v0/createUser', {
        userName: localPart,
        domainName: domain,
        password,
        enablePasswordReset: false,
        sendWelcomeEmail: false,
      })
    },

    async setPassword(localPart, newPassword) {
      await callApi('/api/v0/modifyUser', {
        userName: localPart,
        newPassword,
      })
    },

    async deleteUser(localPart) {
      await callApi('/api/v0/deleteUser', { userName: localPart })
    },

    async getUser(localPart) {
      try {
        await callApi('/api/v0/getUser', { userName: localPart })
        return { exists: true }
      } catch (e) {
        if (e instanceof PurelymailError && e.httpStatus === 404) return { exists: false }
        throw e
      }
    },
  }
}
