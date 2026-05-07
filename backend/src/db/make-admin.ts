import prisma from "./client.js";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = process.env.REDIS_URL ? new (Redis as any)(process.env.REDIS_URL) : null;

function getTargetEmail() {
  const argEmailIndex = process.argv.findIndex((arg) => arg === "--email" || arg === "-e");
  const emailFromFlag = argEmailIndex !== -1 ? process.argv[argEmailIndex + 1] : undefined;
  const positionalEmail = process.argv[2]?.startsWith("-") ? undefined : process.argv[2];
  return (emailFromFlag || positionalEmail || "amosquety@gmail.com").trim().toLowerCase();
}

async function makeAdmin() {
  const email = getTargetEmail();

  console.log(`Promoting ${email} to ADMIN...`);

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, email: true, roles: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const nextRoles = Array.from(new Set([...(user.roles || []), "ADMIN", "USER"]));

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { roles: nextRoles },
    select: { id: true, email: true, roles: true },
  });

  console.log("Database updated:", JSON.stringify(updatedUser, null, 2));

  if (redis) {
    await Promise.all([
      redis.del(`hub:user:${user.id}:profile`),
      redis.del(`user:${user.id}:profile`),
    ]);
    console.log("Redis cache cleared.");
  }

  await prisma.$disconnect();
  if (redis) {
    await redis.quit();
  }

  process.exit(0);
}

makeAdmin().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  if (redis) {
    await redis.quit();
  }
  process.exit(1);
});