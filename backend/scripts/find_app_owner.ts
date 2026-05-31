import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const query = process.argv.slice(2).join(' ').trim()
  if (!query) {
    console.error('Usage: npx tsx scripts/find_app_owner.ts <app name or clientId fragment>')
    process.exit(1)
  }

  const clients = await prisma.oAuthClient.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { clientId: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      clientId: true,
      name: true,
      ownerId: true,
      tenantId: true,
      tenant: { select: { id: true, name: true, clientId: true, ownerId: true } },
      owner: { select: { id: true, email: true, name: true, phoneNumber: true, tenantId: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log(JSON.stringify(clients, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
