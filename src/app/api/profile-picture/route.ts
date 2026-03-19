import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { uploadFile, deleteFile, getFileUrl } from '@/lib/minio'
import { prisma } from '@/lib/prisma'

const MAX_BYTES = 2 * 1024 * 1024

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 2MB or smaller' }, { status: 400 })
  }

  // Get current profile picture to delete later
  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { profilePictureKey: true },
  })

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = await uploadFile(buffer, `pfp-${session.memberId}-${file.name}`, file.type)

  await prisma.member.update({
    where: { id: session.memberId },
    data: { profilePictureKey: key },
  })

  // Clean up old profile picture
  if (member?.profilePictureKey) {
    await deleteFile(member.profilePictureKey)
  }

  return NextResponse.json({ key, url: getFileUrl(key) })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { profilePictureKey: true },
  })

  if (member?.profilePictureKey) {
    await deleteFile(member.profilePictureKey)
  }

  await prisma.member.update({
    where: { id: session.memberId },
    data: { profilePictureKey: null },
  })

  return NextResponse.json({ ok: true })
}