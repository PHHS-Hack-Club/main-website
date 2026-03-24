const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env')

if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const rawLine of envLines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const equalsIndex = line.indexOf('=')
    if (equalsIndex === -1) continue

    const key = line.slice(0, equalsIndex).trim()
    let value = line.slice(equalsIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

module.exports = {
  apps: [
    {
      name: 'phhs-site',
      script: 'node_modules/.bin/next',
      args: 'start -p 3007',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
        CRON_SECRET: process.env.CRON_SECRET,
      },
    },
    {
      name: 'phhs-site-meeting-summary-worker',
      script: 'scripts/meeting-summary-reminder-worker.mjs',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      restart_delay: 5000,
      max_memory_restart: '128M',
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
        CRON_SECRET: process.env.CRON_SECRET,
        MEETING_SUMMARY_WORKER_INTERVAL_MS: 60000,
      },
    },
  ],
}
