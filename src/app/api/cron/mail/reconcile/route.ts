import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPurelymailClient } from '@/lib/purelymail'

async function run(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [purelymailUsers, ourMailboxes] = await Promise.all([
    getPurelymailClient().listUsers(),
    prisma.mailbox.findMany({
      where: { status: { notIn: ['DELETED'] } },
      select: { id: true, localPart: true, domain: true, status: true, memberId: true },
    }),
  ])

  const purelymailSet = new Set(purelymailUsers)
  const ourSet = new Set(ourMailboxes.map((m) => m.localPart))

  const inOursNotTheirs = ourMailboxes
    .filter((m) => !purelymailSet.has(m.localPart))
    .map((m) => ({ localPart: m.localPart, status: m.status, id: m.id }))

  const inTheirsNotOurs = purelymailUsers.filter((u) => !ourSet.has(u))

  const mismatches = [
    ...inOursNotTheirs.map((m) => ({ type: 'missing_in_purelymail', ...m })),
    ...inTheirsNotOurs.map((u) => ({ type: 'missing_in_db', localPart: u })),
  ]

  if (mismatches.length > 0) {
    console.error('[mail:reconcile] drift detected:', JSON.stringify(mismatches))
    // Alert admins if email helper is available
    try {
      const { prisma: db } = await import('@/lib/prisma')
      const { Role } = await import('@prisma/client')
      const admins = await db.member.findMany({
        where: { role: { in: [Role.PRESIDENT, Role.VP] } },
        select: { email: true },
      })
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: admins.map((a) => a.email).join(', '),
        subject: '[PHHS Coding Club] Mail reconciliation drift detected',
        text: `Drift detected between our DB and Purelymail:\n\n${JSON.stringify(mismatches, null, 2)}`,
      })
    } catch (e) {
      console.error('[mail:reconcile] alert email failed:', e instanceof Error ? e.message : 'unknown')
    }
  }

  return NextResponse.json({
    ok: true,
    ourCount: ourMailboxes.length,
    theirCount: purelymailUsers.length,
    mismatches,
  })
}

export async function POST(request: NextRequest) { return run(request) }
export async function GET(request: NextRequest) { return run(request) }
