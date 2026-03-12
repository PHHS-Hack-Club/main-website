import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  deleteImagesForProject,
  serializeImage,
  syncProjectImages,
} from '@/lib/images'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (project.memberId !== session.memberId && !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    ...project,
    images: project.images.map(serializeImage),
  })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
  })

  if (!project || project.memberId !== session.memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  const updated = await prisma.project.update({
    where: { id },
    data: {
      title: body.title ?? project.title,
      description: body.description ?? project.description,
      githubUrl: body.githubUrl !== undefined ? body.githubUrl || null : project.githubUrl,
      demoUrl: body.demoUrl !== undefined ? body.demoUrl || null : project.demoUrl,
      tags: Array.isArray(body.tags) ? body.tags : project.tags,
      hackatimeProject: body.hackatimeProject !== undefined ? (body.hackatimeProject || null) : project.hackatimeProject,
      status: body.submit ? 'PENDING' : project.status === 'REJECTED' ? 'DRAFT' : project.status,
    },
  })

  if (Array.isArray(body.images)) {
    await syncProjectImages(project.id, body.images)
  }

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
  })

  if (!project || project.memberId !== session.memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteImagesForProject(project.id)
  await prisma.project.delete({
    where: { id: project.id },
  })

  return NextResponse.json({ success: true })
}
