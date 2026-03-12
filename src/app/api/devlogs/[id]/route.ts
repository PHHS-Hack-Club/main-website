import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  deleteImagesForDevlog,
  serializeImage,
  syncDevlogImages,
} from '@/lib/images'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const devlog = await prisma.devlog.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!devlog) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (devlog.memberId !== session.memberId && !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    ...devlog,
    images: devlog.images.map(serializeImage),
  })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const devlog = await prisma.devlog.findUnique({
    where: { id },
  })

  if (!devlog || devlog.memberId !== session.memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  const updated = await prisma.devlog.update({
    where: { id },
    data: {
      title: body.title ?? devlog.title,
      body: body.body ?? devlog.body,
      projectId: body.projectId !== undefined ? body.projectId || null : devlog.projectId,
      status: body.submit ? 'PENDING' : devlog.status === 'REJECTED' ? 'DRAFT' : devlog.status,
    },
  })

  if (Array.isArray(body.images)) {
    await syncDevlogImages(devlog.id, body.images)
  }

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const devlog = await prisma.devlog.findUnique({
    where: { id },
  })

  if (!devlog || devlog.memberId !== session.memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteImagesForDevlog(devlog.id)
  await prisma.devlog.delete({
    where: { id: devlog.id },
  })

  return NextResponse.json({ success: true })
}
