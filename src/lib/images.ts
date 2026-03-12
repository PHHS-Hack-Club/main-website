import type { Image } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { deleteFile, getFileUrl } from '@/lib/minio'

export interface UploadedImageInput {
  key: string
  filename: string
}

export interface UploadedImageRecord {
  id: string
  key: string
  url: string
  filename: string
}

export function serializeImage(image: Image): UploadedImageRecord {
  return {
    id: image.id,
    key: image.minioKey,
    url: getFileUrl(image.minioKey),
    filename: image.originalFilename,
  }
}

export async function syncProjectImages(projectId: string, images: UploadedImageInput[]) {
  const existing = await prisma.image.findMany({
    where: { projectId },
  })

  const incomingKeys = new Set(images.map((image) => image.key))
  const existingKeys = new Set(existing.map((image) => image.minioKey))
  const toDelete = existing.filter((image) => !incomingKeys.has(image.minioKey))
  const toCreate = images.filter((image) => !existingKeys.has(image.key))

  if (toDelete.length > 0) {
    await prisma.image.deleteMany({
      where: { id: { in: toDelete.map((image) => image.id) } },
    })

    await Promise.all(toDelete.map((image) => deleteFile(image.minioKey)))
  }

  if (toCreate.length > 0) {
    await prisma.image.createMany({
      data: toCreate.map((image) => ({
        projectId,
        minioKey: image.key,
        originalFilename: image.filename,
      })),
    })
  }
}

export async function syncDevlogImages(devlogId: string, images: UploadedImageInput[]) {
  const existing = await prisma.image.findMany({
    where: { devlogId },
  })

  const incomingKeys = new Set(images.map((image) => image.key))
  const existingKeys = new Set(existing.map((image) => image.minioKey))
  const toDelete = existing.filter((image) => !incomingKeys.has(image.minioKey))
  const toCreate = images.filter((image) => !existingKeys.has(image.key))

  if (toDelete.length > 0) {
    await prisma.image.deleteMany({
      where: { id: { in: toDelete.map((image) => image.id) } },
    })

    await Promise.all(toDelete.map((image) => deleteFile(image.minioKey)))
  }

  if (toCreate.length > 0) {
    await prisma.image.createMany({
      data: toCreate.map((image) => ({
        devlogId,
        minioKey: image.key,
        originalFilename: image.filename,
      })),
    })
  }
}

export async function deleteImagesForProject(projectId: string) {
  const images = await prisma.image.findMany({
    where: { projectId },
  })

  await Promise.all(images.map((image) => deleteFile(image.minioKey)))
}

export async function deleteImagesForDevlog(devlogId: string) {
  const images = await prisma.image.findMany({
    where: { devlogId },
  })

  await Promise.all(images.map((image) => deleteFile(image.minioKey)))
}
