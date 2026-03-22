import prisma from "./client.js";

async function listClients() {
  console.log("--- DEBUG START ---");
  try {
    const clients = await prisma.oAuthClient.findMany();
    console.log(`Found ${clients.length} clients.`);
    clients.forEach(c => {
      console.log(`- ID: ${c.clientId} | Name: ${c.name}`);
    });
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    console.log("--- DEBUG END ---");
    await prisma.$disconnect();
  }
}

listClients();
