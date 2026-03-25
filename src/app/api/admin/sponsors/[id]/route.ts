import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile, getFileUrl } from '@/lib/minio'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const existing = await prisma.sponsor.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
  }

  if (body.title !== undefined && !body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (body.linkUrl !== undefined && !body.linkUrl?.trim()) {
    return NextResponse.json({ error: 'Sponsor link is required' }, { status: 400 })
  }

  const nextLogoKey =
    body.logoKey !== undefined && typeof body.logoKey === 'string'
      ? body.logoKey.trim()
      : existing.logoKey

  if (!nextLogoKey) {
    return NextResponse.json({ error: 'Sponsor logo is required' }, { status: 400 })
  }

  const sponsor = await prisma.sponsor.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.linkUrl !== undefined ? { linkUrl: body.linkUrl.trim() } : {}),
      ...(body.logoKey !== undefined ? { logoKey: nextLogoKey } : {}),
      ...(body.description !== undefined ? { description: optionalText(body.description) } : {}),
      ...(body.tier !== undefined ? { tier: optionalText(body.tier) } : {}),
      ...(body.sortOrder !== undefined
        ? { sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0 }
        : {}),
      ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
    },
  })

  if (body.logoKey !== undefined && existing.logoKey !== nextLogoKey) {
    await deleteFile(existing.logoKey)
  }

  return NextResponse.json({ sponsor: serializeSponsor(sponsor) })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.sponsor.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
  }

  await prisma.sponsor.delete({ where: { id } })
  await deleteFile(existing.logoKey)

  return NextResponse.json({ success: true })
}
