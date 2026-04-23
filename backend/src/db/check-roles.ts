import prisma from "./client.js";

async function checkUser() {
  const user = await prisma.user.findFirst({
    where: { email: "admin@authhub.local" },
    select: { email: true, roles: true }
  });
  console.log("User in DB:", JSON.stringify(user, null, 2));
  process.exit(0);
}

checkUser();
