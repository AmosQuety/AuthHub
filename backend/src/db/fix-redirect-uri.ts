import prisma from "./client.js";

const CLIENT_ID = "19d4f71e-0043-46a7-bc49-16202f475806"; // The demo app client ID
const REDIRECT_URI = "http://localhost:8888/callback";

async function fix() {
  const client = await prisma.oAuthClient.findUnique({ where: { clientId: CLIENT_ID } });
  
  if (!client) {
    console.error("Client not found! Check your client ID.");
    process.exit(1);
  }
  
  console.log("Current client:", { name: client.name, redirectUris: client.redirectUris });
  
  const updatedUris = client.redirectUris.includes(REDIRECT_URI)
    ? client.redirectUris
    : [...client.redirectUris, REDIRECT_URI];

  const updated = await prisma.oAuthClient.update({
    where: { clientId: CLIENT_ID },
    data: { redirectUris: updatedUris }
  });
  
  console.log("✅ Updated redirect URIs:", updated.redirectUris);
  process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });
