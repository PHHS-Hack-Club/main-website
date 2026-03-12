import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncDevlogImages } from '@/lib/images'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projects = await prisma.project.findMany({
    where: { memberId: session.memberId },
    select: {
      id: true,
      title: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const devlog = await prisma.devlog.create({
    data: {
      memberId: session.memberId,
      title: body.title || '',
      body: body.body || '',
      projectId: body.projectId || null,
      status: body.submit ? 'PENDING' : 'DRAFT',
    },
  })

  if (Array.isArray(body.images) && body.images.length > 0) {
    await syncDevlogImages(devlog.id, body.images)
  }

  return NextResponse.json(devlog)
}
