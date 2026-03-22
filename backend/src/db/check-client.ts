import prisma from "./client.js";

async function checkClient() {
  const clientId = "204373fd-64bd-45e5-9f52-75f4822555b3";
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId }
  });
  
  if (client) {
    console.log("Found client:", {
        clientId: client.clientId,
        name: client.name,
        isPublic: client.isPublic,
        redirectUris: client.redirectUris
    });
  } else {
    console.log("Client NOT found in database.");
  }
  await prisma.$disconnect();
}

checkClient();
