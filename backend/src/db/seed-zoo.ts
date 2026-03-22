import prisma from "./client.js";
import { hashPassword } from "../core/crypto.js";

const seedZooClient = async () => {
  try {
    const clientId = "zoo-app-client";
    const clientSecret = "zoo-app-secret";
    const clientSecretHash = await hashPassword(clientSecret);

    const client = await prisma.oAuthClient.upsert({
      where: { clientId },
      update: {
        clientSecretHash,
        redirectUris: ["http://localhost:4000/callback"],
        name: "Virtual Zoo Portal",
        scopes: ["openid", "profile", "email"],
      },
      create: {
        clientId,
        clientSecretHash,
        isPublic: false,
        scopes: ["openid", "profile", "email"],
        redirectUris: ["http://localhost:4000/callback"],
        name: "Virtual Zoo Portal",
      },
    });

    console.log("✅ Zoo OAuth Client Seeded Successfully!");
    console.log(`-----------------------------------------`);
    console.log(`Client ID:     ${client.clientId}`);
    console.log(`Client Secret: ${clientSecret}`);
    console.log(`Redirect URI:  ${client.redirectUris[0]}`);
    console.log(`-----------------------------------------`);
  } catch (error) {
    console.error("❌ Error seeding Zoo client:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seedZooClient();
