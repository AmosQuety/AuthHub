import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const ids = [
    // amosnabasa256@gmail.com
    'da585e9d-9263-4497-9d38-306634982186',
    '8a66fc54-b317-408f-a629-99e45619ac76',
    'a922ba04-f823-4891-98fc-26f2405023e8',
    '9abafbc2-c8f5-4074-99bd-aa987e0e1450',
    '2148d92e-f6c8-40b1-aeb0-c6e5d3b910b1',
    '7779fe71-5f29-41dc-a122-e34e9e441af1',
    '35e812f3-a309-45e2-bd52-e3d878143c7f',
    '22f9b931-887f-4368-abb5-8ea48df5aeea',
    '67b5d302-74ee-4df1-8136-56f53092cbfb',
    // amosnabasa4@gmail.com
    'dc93f9af-3427-4a7d-b6a5-fdc253795379',
    'f34ef1fe-b837-4a35-b186-7b93e8cfe0e6',
    'fb07e24d-efcf-4444-80ed-27d2b144723e',
    'ebd5f541-fb05-40f1-bd14-58e9e789d4b7',
    'f94497e3-c392-405c-979c-f318349e0645',
  ]

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const outDir = path.join(__dirname, 'backups')
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `deleted-users-${Date.now()}.json`)

  console.log('Exporting user rows for IDs:', ids.length)

  const exported: Record<string, any>[] = []

  for (const id of ids) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        sessions: true,
        authProviders: true,
        mfaMethods: true,
        auditLogs: true,
        consents: true,
        entitlements: true,
        ownedClients: true,
      },
    })
    exported.push({ id, found: !!user, user })
  }

  fs.writeFileSync(outFile, JSON.stringify(exported, null, 2), 'utf8')
  console.log('Export written to', outFile)

  // Proceed to delete
  console.log('Deleting users...')
  const del = await prisma.user.deleteMany({ where: { id: { in: ids } } })
  console.log('Delete result:', del)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
