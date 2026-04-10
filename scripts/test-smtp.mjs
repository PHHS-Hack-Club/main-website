import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import nodemailer from 'nodemailer'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(scriptDir, '..')
const initialEnvKeys = new Set(Object.keys(process.env))

loadEnvFile('.env')
loadEnvFile('.env.local')

const missing = ['SMTP_HOST', 'SMTP_PORT'].filter((key) => !process.env[key])

if (missing.length > 0) {
  console.error(`[smtp-test] missing required env vars: ${missing.join(', ')}`)
  process.exit(1)
}

if (process.env.SMTP_USER && !process.env.SMTP_PASS) {
  console.error('[smtp-test] SMTP_USER is set, but SMTP_PASS is missing')
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === '465',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
})

try {
  await transporter.verify()
  console.log(
    `[smtp-test] connected to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`
  )
} catch (error) {
  console.error(
    '[smtp-test] SMTP verification failed:',
    error instanceof Error ? error.message : error
  )
  process.exit(1)
}

const rl = createInterface({ input, output })

try {
  const to = await promptForEmail(rl)

  if (!to) {
    console.log('[smtp-test] no recipient entered, aborting')
    process.exit(0)
  }

  const from = process.env.SMTP_USER
    ? `"PHHS Hack Club SMTP Test" <${process.env.SMTP_USER}>`
    : 'PHHS Hack Club SMTP Test <no-reply@localhost>'

  const subject = `PHHS Hack Club SMTP Test ${new Date().toISOString()}`
  const text = [
    'This is a test email from the PHHS Hack Club site.',
    '',
    `SMTP host: ${process.env.SMTP_HOST}`,
    `SMTP port: ${process.env.SMTP_PORT}`,
    `Sent at: ${new Date().toString()}`,
  ].join('\n')

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: [
      '<p>This is a test email from the PHHS Hack Club site.</p>',
      '<ul>',
      `  <li><strong>SMTP host:</strong> ${process.env.SMTP_HOST}</li>`,
      `  <li><strong>SMTP port:</strong> ${process.env.SMTP_PORT}</li>`,
      `  <li><strong>Sent at:</strong> ${new Date().toString()}</li>`,
      '</ul>',
    ].join('\n'),
  })

  console.log(`[smtp-test] sent test email to ${to}`)
} catch (error) {
  console.error(
    '[smtp-test] failed to send test email:',
    error instanceof Error ? error.message : error
  )
  process.exitCode = 1
} finally {
  rl.close()
}

async function promptForEmail(rl) {
  while (true) {
    const answer = (await rl.question('Send test email to: ')).trim()

    if (!answer) {
      return ''
    }

    if (isValidEmail(answer)) {
      return answer
    }

    console.log('[smtp-test] enter a valid email address or press Enter to cancel')
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function loadEnvFile(name) {
  const filePath = resolve(rootDir, name)

  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)

    if (!match) {
      continue
    }

    const [, key, rawValue] = match

    if (initialEnvKeys.has(key)) {
      continue
    }

    let value = rawValue

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}
