import { PrismaClient } from '@prisma/client'

const RESERVED: Array<[string, string]> = [
  ['admin', 'operational'],
  ['administrator', 'operational'],
  ['root', 'operational'],
  ['postmaster', 'rfc2142'],
  ['hostmaster', 'rfc2142'],
  ['webmaster', 'rfc2142'],
  ['abuse', 'rfc2142'],
  ['security', 'rfc2142'],
  ['noc', 'rfc2142'],
  ['noreply', 'operational'],
  ['no-reply', 'operational'],
  ['mailer-daemon', 'operational'],
  ['daemon', 'operational'],
  ['contact', 'role'],
  ['support', 'role'],
  ['help', 'role'],
  ['info', 'role'],
  ['hello', 'role'],
  ['sales', 'role'],
  ['billing', 'role'],
  ['president', 'club-role'],
  ['vp', 'club-role'],
  ['vicepresident', 'club-role'],
  ['treasurer', 'club-role'],
  ['secretary', 'club-role'],
  ['officer', 'club-role'],
  ['officers', 'club-role'],
  ['board', 'club-role'],
  ['advisor', 'club-role'],
  ['sponsor', 'club-role'],
  ['club', 'identity'],
  ['phhs', 'identity'],
  ['phhshack', 'identity'],
  ['hackclub', 'identity'],
  ['team', 'identity'],
  ['staff', 'identity'],
  ['system', 'system'],
  ['test', 'system'],
  ['dev', 'system'],
  ['mail', 'system'],
  ['email', 'system'],
  ['www', 'system'],
  ['ftp', 'system'],
  ['announce', 'announcement'],
  ['announcements', 'announcement'],
  ['news', 'announcement'],
  ['newsletter', 'announcement'],
  ['events', 'announcement'],
]

const prisma = new PrismaClient()

async function main() {
  for (const [localPart, reason] of RESERVED) {
    await prisma.reservedLocalPart.upsert({
      where: { localPart },
      update: { reason },
      create: { localPart, reason },
    })
  }
  const count = await prisma.reservedLocalPart.count()
  console.log(`Seeded ${RESERVED.length} reserved local parts. Total in DB: ${count}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
