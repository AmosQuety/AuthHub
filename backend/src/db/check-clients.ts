import prisma from "./client.js";

async function check() {
  const clients = await prisma.oAuthClient.findMany({
    select: { clientId: true, name: true, redirectUris: true, isPublic: true }
  });
  console.log("OAuth Clients in DB:", JSON.stringify(clients, null, 2));
  process.exit(0);
}
check().catch(err => { console.error(err); process.exit(1); });
