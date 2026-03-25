import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/minio'
import {
  isUsernameTaken,
  normalizeUsername,
  validateUsername,
} from '@/lib/member-username'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const username = typeof body.username === 'string' ? normalizeUsername(body.username) : ''

  if (username) {
    const usernameError = validateUsername(username)

    if (usernameError) {
      return NextResponse.json({ error: usernameError }, { status: 400 })
    }

    if (await isUsernameTaken(username, id)) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
    }
  }

  const member = await prisma.member.update({
    where: { id },
    data: {
      username: username || null,
      name: body.name,
      email: body.email,
      role: body.role,
    },
  })

  return NextResponse.json(member)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  if (session.memberId === id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const member = await prisma.member.findUnique({
    where: { id },
    select: {
      profilePictureKey: true,
      headshotKey: true,
      projects: {
        select: {
          images: {
            select: { minioKey: true },
          },
        },
      },
      devlogs: {
        select: {
          images: {
            select: { minioKey: true },
          },
        },
      },
    },
  })

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const minioKeys = new Set<string>()
  if (member.profilePictureKey) {
    minioKeys.add(member.profilePictureKey)
  }
  if (member.headshotKey) {
    minioKeys.add(member.headshotKey)
  }

  for (const project of member.projects) {
    for (const image of project.images) {
      minioKeys.add(image.minioKey)
    }
  }

  for (const devlog of member.devlogs) {
    for (const image of devlog.images) {
      minioKeys.add(image.minioKey)
    }
  }

  await prisma.member.delete({
    where: { id },
  })

  await Promise.all([...minioKeys].map((key) => deleteFile(key)))

  return NextResponse.json({ success: true })
}
