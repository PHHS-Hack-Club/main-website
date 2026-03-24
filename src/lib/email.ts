import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
}

function senderAddress() {
  return `"PHHS Hack Club" <${process.env.SMTP_USER}>`
}

const meetingDateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

function emailTemplate({
  preheader,
  badge,
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  preheader: string
  badge: string
  heading: string
  body: string
  ctaLabel: string
  ctaUrl: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <!-- preheader (hidden preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;color:#0f0f13;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;" align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#ec3750;width:4px;border-radius:2px;">&nbsp;</td>
                  <td style="padding-left:12px;">
                    <span style="font-size:13px;font-weight:800;letter-spacing:0.1em;color:#ec3750;text-transform:uppercase;font-family:monospace;">PHHS HACK CLUB</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1a1a24;border:1px solid #2a2a38;border-radius:12px;overflow:hidden;">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#ec3750,#ff6b35);height:3px;font-size:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 32px 8px;">

                    <!-- Badge -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="background:#2a1a1f;border:1px solid rgba(236,55,80,0.3);border-radius:20px;padding:4px 12px;">
                          <span style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#ec3750;font-family:monospace;text-transform:uppercase;">${badge}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Heading -->
                    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">${heading}</h1>

                    <!-- Body text -->
                    <div style="font-size:15px;color:#a0a0b8;line-height:1.6;">${body}</div>

                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding:24px 32px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#ec3750;border-radius:8px;">
                          <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">${ctaLabel} →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;" align="center">
              <p style="margin:0;font-size:12px;color:#4a4a5a;font-family:monospace;">
                Peninsula High School Hack Club &nbsp;·&nbsp; Admin notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendVerificationNotification({
  name,
  email,
  adminUrl,
}: {
  name: string
  email: string
  adminUrl: string
}) {
  if (!process.env.SMTP_HOST || !process.env.ADMIN_EMAIL) return

  console.log(`[email] sending verification notification for ${name} (${email}) to ${process.env.ADMIN_EMAIL}`)
  await createTransporter().sendMail({
    from: senderAddress(),
    to: process.env.ADMIN_EMAIL,
    subject: `New Verification Request: ${name}`,
    text: `${name} (${email}) has requested to join PHHS Hack Club.\n\nReview their request here: ${adminUrl}`,
    html: emailTemplate({
      preheader: `${name} wants to join the club`,
      badge: 'Verification Request',
      heading: `${name} wants to join`,
      body: `<p style="margin:0 0 12px;"><strong style="color:#ffffff;">${name}</strong> signed in with Hack Club and is waiting for approval.</p><p style="margin:0;"><span style="font-family:monospace;font-size:13px;background:#12121a;border:1px solid #2a2a38;border-radius:4px;padding:3px 8px;color:#a0a0b8;">${email}</span></p>`,
      ctaLabel: 'Review request',
      ctaUrl: adminUrl,
    }),
  })
}

export async function sendSubmissionNotification({
  type,
  title,
  memberName,
  adminUrl,
}: {
  type: 'project' | 'devlog'
  title: string
  memberName: string
  adminUrl: string
}) {
  if (!process.env.SMTP_HOST || !process.env.ADMIN_EMAIL) return

  const label = type === 'project' ? 'Project' : 'Devlog'

  console.log(`[email] sending ${type} submission notification "${title}" by ${memberName} to ${process.env.ADMIN_EMAIL}`)
  await createTransporter().sendMail({
    from: senderAddress(),
    to: process.env.ADMIN_EMAIL,
    subject: `New ${label} Submission: ${title}`,
    text: `${memberName} submitted a ${type} titled "${title}".\n\nReview it here: ${adminUrl}`,
    html: emailTemplate({
      preheader: `${memberName} submitted a ${type} for review`,
      badge: `New ${label}`,
      heading: title,
      body: `<p style="margin:0;"><strong style="color:#ffffff;">${memberName}</strong> submitted this ${type} for approval. Review it and approve or reject it from the admin panel.</p>`,
      ctaLabel: 'Review submission',
      ctaUrl: adminUrl,
    }),
  })
}

export async function sendMeetingSummaryReminder({
  to,
  meetingTitle,
  meetingDate,
  adminUrl,
}: {
  to: string | string[]
  meetingTitle: string
  meetingDate: Date
  adminUrl: string
}) {
  if (!process.env.SMTP_HOST) return

  const formattedDate = meetingDateFmt.format(meetingDate)
  const logTarget = Array.isArray(to) ? to.join(', ') : to

  console.log(`[email] sending meeting summary reminder for "${meetingTitle}" to ${logTarget}`)
  await createTransporter().sendMail({
    from: senderAddress(),
    to,
    subject: `Meeting Summary Needed: ${meetingTitle}`,
    text:
      `Please fill out the summary for "${meetingTitle}" on ${formattedDate}.\n\n` +
      `Include what happened and any materials, handouts, or links from the meeting.\n\n` +
      `Open the meetings admin page here: ${adminUrl}`,
    html: emailTemplate({
      preheader: `Fill out the meeting summary for ${meetingTitle}`,
      badge: 'Meeting Summary',
      heading: `Add the summary for ${meetingTitle}`,
      body:
        `<p style="margin:0 0 12px;">Today's meeting is on the calendar, but its recap is still empty.</p>` +
        `<p style="margin:0 0 12px;">Please add <strong style="color:#ffffff;">what happened</strong> and any <strong style="color:#ffffff;">materials, handouts, or links</strong> from the meeting.</p>` +
        `<p style="margin:0;"><span style="font-family:monospace;font-size:13px;background:#12121a;border:1px solid #2a2a38;border-radius:4px;padding:3px 8px;color:#a0a0b8;">${formattedDate}</span></p>`,
      ctaLabel: 'Open meetings admin',
      ctaUrl: adminUrl,
    }),
  })
}

export async function sendMemberEmail({
  to,
  subject,
  heading,
  body,
  badge = 'Announcement',
  ctaLabel,
  ctaUrl,
}: {
  to: string
  subject: string
  heading: string
  body: string
  badge?: string
  ctaLabel?: string
  ctaUrl?: string
}) {
  if (!process.env.SMTP_HOST) return

  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://phhshack.club'
  const resolvedCtaLabel = ctaLabel ?? 'View club site'
  const resolvedCtaUrl = ctaUrl ?? siteUrl

  console.log(`[email] sending member email to ${to}: ${subject}`)
  await createTransporter().sendMail({
    from: senderAddress(),
    to,
    replyTo: 'aradu28@pascack.org',
    subject,
    text: `${heading}\n\n${body}\n\n${resolvedCtaUrl}`,
    html: emailTemplate({
      preheader: subject,
      badge,
      heading,
      body: `<p style="margin:0;">${body}</p>`,
      ctaLabel: resolvedCtaLabel,
      ctaUrl: resolvedCtaUrl,
    }),
  })
}
