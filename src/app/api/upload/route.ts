import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getFileUrl, uploadFile } from '@/lib/minio'

const MAX_BYTES = 5 * 1024 * 1024

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
    return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Images must be 5MB or smaller' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = await uploadFile(buffer, file.name, file.type)

  return NextResponse.json({
    key,
    url: getFileUrl(key),
  })
}
