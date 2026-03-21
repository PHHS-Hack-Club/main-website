import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const modal = await prisma.siteModal.findFirst({
    where: { enabled: true },
    select: { id: true, heading: true, body: true },
  })

  return NextResponse.json(modal ?? null)
}
