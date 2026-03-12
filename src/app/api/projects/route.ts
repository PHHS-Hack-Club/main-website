import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncProjectImages } from '@/lib/images'

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const project = await prisma.project.create({
    data: {
      memberId: session.memberId,
      title: body.title || '',
      description: body.description || '',
      githubUrl: body.githubUrl || null,
      demoUrl: body.demoUrl || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      status: body.submit ? 'PENDING' : 'DRAFT',
    },
  })

  if (Array.isArray(body.images) && body.images.length > 0) {
    await syncProjectImages(project.id, body.images)
  }

  return NextResponse.json(project)
}
