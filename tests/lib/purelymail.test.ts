import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getPurelymailClient, PurelymailError } from '@/lib/purelymail'

const OLD_ENV = process.env

function mockFetchOnce(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  })
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

function mockFetchSequence(responses: Array<{ status: number; body: unknown }>) {
  const fn = vi.fn()
  for (const r of responses) {
    fn.mockResolvedValueOnce({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
      text: async () => JSON.stringify(r.body),
    })
  }
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

beforeEach(() => {
  process.env = {
    ...OLD_ENV,
    PURELYMAIL_API_TOKEN: 'test-token',
    PURELYMAIL_DOMAIN: 'phhshack.club',
  }
})

afterEach(() => {
  process.env = OLD_ENV
  vi.restoreAllMocks()
})

describe('PurelymailClient', () => {
  it('createUser posts correct body and header', async () => {
    const fn = mockFetchOnce(200, { type: 'success' })
    await getPurelymailClient().createUser('alexradu', 'hunter22hunter22')
    expect(fn).toHaveBeenCalledTimes(1)
    const [url, init] = fn.mock.calls[0]
    expect(url).toBe('https://purelymail.com/api/v0/createUser')
    expect((init as RequestInit).method).toBe('POST')
    const headers = (init as RequestInit).headers as Record<string, string>
    expect(headers['Purelymail-Api-Token']).toBe('test-token')
    expect(headers['Content-Type']).toBe('application/json')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body).toMatchObject({
      userName: 'alexradu',
      domainName: 'phhshack.club',
      password: 'hunter22hunter22',
      enablePasswordReset: false,
      sendWelcomeEmail: false,
    })
  })

  it('listUsers returns users array', async () => {
    mockFetchOnce(200, { users: ['alexradu', 'adalovelace'] })
    const users = await getPurelymailClient().listUsers()
    expect(users).toEqual(['alexradu', 'adalovelace'])
  })

  it('setPassword calls modifyUser with newPassword field', async () => {
    const fn = mockFetchOnce(200, { type: 'success' })
    await getPurelymailClient().setPassword('alexradu', 'newpassword1234')
    const [url, init] = fn.mock.calls[0]
    expect(url).toBe('https://purelymail.com/api/v0/modifyUser')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.newPassword).toBe('newpassword1234')
    expect(body.userName).toBe('alexradu')
  })

  it('deleteUser calls deleteUser endpoint', async () => {
    const fn = mockFetchOnce(200, { type: 'success' })
    await getPurelymailClient().deleteUser('alexradu')
    const [url] = fn.mock.calls[0]
    expect(url).toBe('https://purelymail.com/api/v0/deleteUser')
  })

  it('getUser returns { exists: true } on 200', async () => {
    mockFetchOnce(200, { enableSearchIndexing: false })
    const result = await getPurelymailClient().getUser('alexradu')
    expect(result.exists).toBe(true)
  })

  it('getUser returns { exists: false } on 404', async () => {
    mockFetchOnce(404, { type: 'error', code: 'user_not_found' })
    const result = await getPurelymailClient().getUser('alexradu')
    expect(result.exists).toBe(false)
  })

  it('throws PurelymailError on non-404 4xx', async () => {
    mockFetchOnce(400, { type: 'error', code: 'user_already_exists', message: 'already exists' })
    await expect(getPurelymailClient().createUser('alexradu', 'pw')).rejects.toBeInstanceOf(PurelymailError)
  })

  it('PurelymailError carries httpStatus', async () => {
    mockFetchOnce(409, { type: 'error', code: 'conflict', message: 'conflict' })
    try {
      await getPurelymailClient().createUser('alexradu', 'pw')
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(PurelymailError)
      expect((e as PurelymailError).httpStatus).toBe(409)
    }
  })

  it('retries once on 5xx then succeeds', async () => {
    const fn = mockFetchSequence([
      { status: 500, body: { error: 'internal' } },
      { status: 200, body: { type: 'success' } },
    ])
    await getPurelymailClient().createUser('alexradu', 'pw')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws PurelymailError after second 5xx', async () => {
    mockFetchSequence([
      { status: 500, body: { error: 'e1' } },
      { status: 500, body: { error: 'e2' } },
    ])
    await expect(getPurelymailClient().createUser('alexradu', 'pw')).rejects.toBeInstanceOf(PurelymailError)
  })

  it('throws if PURELYMAIL_API_TOKEN missing', async () => {
    delete process.env.PURELYMAIL_API_TOKEN
    await expect(getPurelymailClient().listUsers()).rejects.toThrow(/PURELYMAIL_API_TOKEN/)
  })

  it('error message does not contain the password', async () => {
    mockFetchOnce(400, { type: 'error', code: 'bad', message: 'bad request' })
    try {
      await getPurelymailClient().createUser('alexradu', 'my-super-secret-password')
      expect.fail('should have thrown')
    } catch (e) {
      const msg = (e as Error).message
      expect(msg).not.toContain('my-super-secret-password')
    }
  })
})
