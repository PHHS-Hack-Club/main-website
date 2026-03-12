import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
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
}

export async function POST(request: NextRequest) {
  const { name, email, message } = await request.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  try {
    await createTransporter().sendMail({
      from: process.env.SMTP_USER ? `"PHHS Hack Club Contact" <${process.env.SMTP_USER}>` : email,
      to: process.env.CONTACT_EMAIL_TO,
      replyTo: email,
      subject: `PHHS Hack Club Contact: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><hr /><p>${String(message).replace(/\n/g, '<br />')}</p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact email failed', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
