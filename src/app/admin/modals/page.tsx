import { prisma } from '@/lib/prisma'
import ModalManager from '@/components/admin/ModalManager'

export default async function ModalsPage() {
  const modals = await prisma.siteModal.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const serialized = modals.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }))

  return <ModalManager initialModals={serialized} />
}
