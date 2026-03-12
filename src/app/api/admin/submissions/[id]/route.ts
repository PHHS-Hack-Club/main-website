import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { type, action } = await request.json()

  const status = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : null

  if (!status) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (type === 'project') {
    const updated = await prisma.project.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  }

  if (type === 'devlog') {
    const updated = await prisma.devlog.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
