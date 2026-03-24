const port = process.env.PORT || '3007'
const intervalMs = Number(process.env.MEETING_SUMMARY_WORKER_INTERVAL_MS || 60_000)
const baseUrl = process.env.INTERNAL_APP_URL || `http://127.0.0.1:${port}`
const endpoint = `${baseUrl}/api/cron/meeting-summary-reminders`

if (!process.env.CRON_SECRET) {
  console.error('[meeting-summary-worker] CRON_SECRET is not set')
  process.exit(1)
}

let inFlight = false

async function tick() {
  if (inFlight) return
  inFlight = true

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      signal: AbortSignal.timeout(30_000),
    })

    const text = await response.text()
    let payload = null

    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }

    if (!response.ok) {
      console.error('[meeting-summary-worker] request failed', {
        status: response.status,
        payload,
      })
      return
    }

    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.errors) && payload.errors.length > 0) {
        console.error('[meeting-summary-worker] reminder errors', payload.errors)
      }

      if (typeof payload.sent === 'number' && payload.sent > 0) {
        console.log('[meeting-summary-worker] sent reminder emails', {
          dateKey: payload.dateKey,
          sent: payload.sent,
          total: payload.total,
        })
      }
    }
  } catch (error) {
    console.error(
      '[meeting-summary-worker] request crashed',
      error instanceof Error ? error.message : error
    )
  } finally {
    inFlight = false
  }
}

console.log(
  `[meeting-summary-worker] polling ${endpoint} every ${Math.round(intervalMs / 1000)}s`
)

await tick()

const timer = setInterval(tick, intervalMs)

function shutdown(signal) {
  console.log(`[meeting-summary-worker] received ${signal}, shutting down`)
  clearInterval(timer)
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
