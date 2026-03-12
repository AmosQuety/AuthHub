import prisma from "./client.js";
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redis = new Redis(process.env.REDIS_URL!);

async function elevateAdmin() {
  const email = "admin@authhub.local";
  
  console.log(`Elevating ${email} to ADMIN...`);
  
  const user = await prisma.user.update({
    where: { email },
    data: {
      roles: ["ADMIN", "USER"]
    }
  });

  console.log("Database updated! Roles:", user.roles);

  // Clear the cache to make sure the API sees the new roles
  await redis.del(`user:${user.id}:profile`);
  console.log("Redis cache cleared!");
  
  process.exit(0);
}

elevateAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
