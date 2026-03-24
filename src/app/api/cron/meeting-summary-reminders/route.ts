import { Role } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { sendMeetingSummaryReminder } from '@/lib/email'
import { prisma } from '@/lib/prisma'

const easternFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
})

function getEasternNow(date = new Date()) {
  const values = Object.fromEntries(
    easternFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  ) as { year: string; month: string; day: string; hour: string }

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  }
}

function utcRangeForDateKey(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

function isBlank(value: string | null) {
  return !value || !value.trim()
}

async function run(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }

  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const { dateKey, hour } = getEasternNow(now)

  if (hour < 17) {
    return NextResponse.json({
      ok: true,
      skipped: 'before 5pm America/New_York',
      dateKey,
      hour,
    })
  }

  const { start, end } = utcRangeForDateKey(dateKey)
  const meetings = await prisma.meeting.findMany({
    where: {
      date: { gte: start, lt: end },
      summaryReminderSentAt: null,
    },
    orderBy: { date: 'asc' },
  })

  const meetingsNeedingSummary = meetings.filter((meeting) => isBlank(meeting.summary))

  if (meetingsNeedingSummary.length === 0) {
    return NextResponse.json({
      ok: true,
      dateKey,
      sent: 0,
      skipped: 'no meetings need a summary reminder',
    })
  }

  const adminMembers = await prisma.member.findMany({
    where: {
      role: { in: [Role.PRESIDENT, Role.VP] },
    },
    select: {
      email: true,
      schoolEmail: true,
    },
  })

  const recipients = [
    ...new Set(
      [
        ...adminMembers.map((member) => member.schoolEmail || member.email),
        ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []),
      ].filter(Boolean)
    ),
  ]

  if (recipients.length === 0) {
    return NextResponse.json({
      ok: true,
      dateKey,
      sent: 0,
      skipped: 'no admin recipients configured',
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3007'
  const sentMeetingIds: string[] = []
  const errors: string[] = []

  for (const meeting of meetingsNeedingSummary) {
    try {
      await sendMeetingSummaryReminder({
        to: recipients,
        meetingTitle: meeting.title,
        meetingDate: meeting.date,
        adminUrl: `${baseUrl}/admin/meetings`,
      })
      sentMeetingIds.push(meeting.id)
    } catch (error) {
      errors.push(
        `${meeting.title}: ${error instanceof Error ? error.message : 'failed to send'}`
      )
    }
  }

  if (sentMeetingIds.length > 0) {
    await prisma.meeting.updateMany({
      where: { id: { in: sentMeetingIds } },
      data: { summaryReminderSentAt: now },
    })
  }

  return NextResponse.json({
    ok: true,
    dateKey,
    sent: sentMeetingIds.length,
    total: meetingsNeedingSummary.length,
    errors,
  })
}

export async function POST(request: NextRequest) {
  return run(request)
}

export async function GET(request: NextRequest) {
  return run(request)
}
