import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenants = await prisma.tenant.findMany({ where: { ownerId: null } })
  const out: any[] = []

  for (const t of tenants) {
    const candidate = await prisma.user.findFirst({ where: { tenantId: t.id }, orderBy: { createdAt: 'desc' } })
    if (candidate) {
      await prisma.tenant.update({ where: { id: t.id }, data: { ownerId: candidate.id } })
      out.push({ tenantId: t.id, assignedOwnerId: candidate.id })
    } else {
      out.push({ tenantId: t.id, assignedOwnerId: null })
    }
  }

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const outDir = path.join(__dirname, 'backups')
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `backfill-tenant-owners-${Date.now()}.json`)
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8')
  console.log('Backfill results written to', outFile)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
