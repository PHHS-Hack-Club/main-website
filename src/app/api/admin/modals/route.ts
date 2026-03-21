import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const modals = await prisma.siteModal.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(modals)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  const modal = await prisma.siteModal.create({
    data: {
      title: body.title || 'Untitled modal',
      heading: body.heading || '',
      body: body.body || '',
    },
  })

  return NextResponse.json(modal)
}
