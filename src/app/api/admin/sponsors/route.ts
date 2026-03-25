import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'

function optionalText(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function serializeSponsor(sponsor: {
  id: string
  title: string
  linkUrl: string
  logoKey: string
  description: string | null
  tier: string | null
  sortOrder: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...sponsor,
    logoUrl: getFileUrl(sponsor.logoKey),
  }
}

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const sponsors = await prisma.sponsor.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json({ sponsors: sponsors.map(serializeSponsor) })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()

  if (!body.title?.trim() || !body.linkUrl?.trim() || !body.logoKey?.trim()) {
    return NextResponse.json(
      { error: 'Title, sponsor link, and logo are required.' },
      { status: 400 }
    )
  }

  const sponsor = await prisma.sponsor.create({
    data: {
      title: body.title.trim(),
      linkUrl: body.linkUrl.trim(),
      logoKey: body.logoKey.trim(),
      description: optionalText(body.description),
      tier: optionalText(body.tier),
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      active: body.active ?? true,
    },
  })

  return NextResponse.json({ sponsor: serializeSponsor(sponsor) }, { status: 201 })
}
