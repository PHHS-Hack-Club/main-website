import { Client } from 'minio'

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number(process.env.MINIO_PORT || 9002),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

const bucket = process.env.MINIO_BUCKET || 'phhs-uploads'

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(bucket)

  if (!exists) {
    await minioClient.makeBucket(bucket)
  }
}

export async function uploadFile(buffer: Buffer, filename: string, contentType: string) {
  await ensureBucket()
  const key = `${Date.now()}-${filename.replace(/\s+/g, '-').toLowerCase()}`

  await minioClient.putObject(bucket, key, buffer, buffer.length, {
    'Content-Type': contentType,
  })

  return key
}

export async function deleteFile(key: string) {
  try {
    await minioClient.removeObject(bucket, key)
  } catch {
    // Ignore deletion failures for already-missing files.
  }
}

export function getFileUrl(key: string) {
  const publicUrl = process.env.MINIO_PUBLIC_URL

  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, '')}/${key}`
  }

  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
  const port = process.env.MINIO_PORT || '9002'

  return `${protocol}://${endpoint}:${port}/${bucket}/${key}`
}
