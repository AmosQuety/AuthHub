import crypto from 'crypto'
import prisma from '../src/db/client.js'
import { hashPassword } from '../src/core/crypto.js'

async function main() {
  const email = 'admin@authhub.local'
  const tempPassword = `AuthHub-${crypto.randomBytes(6).toString('hex')}!`
  const passwordHash = await hashPassword(tempPassword)

  const user = await prisma.user.findFirst({ where: { email } })
  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  await prisma.session.deleteMany({ where: { userId: user.id } })

  console.log(JSON.stringify({ email, tempPassword, userId: user.id }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
