import prisma from "./client.js";
import { hashPassword } from "../core/crypto.js";

const seedClient = async () => {
  try {
    const clientId = "authhub-web-client";
    const clientSecret = "super-secret-secret";
    const clientSecretHash = await hashPassword(clientSecret);

    const client = await prisma.oAuthClient.upsert({
      where: { clientId },
      update: {},
      create: {
        clientId,
        clientSecretHash,
        isPublic: false,
        scopes: ["openid", "profile", "email"],
        redirectUris: ["http://localhost:3000/callback", "https://oauth.pstmn.io/v1/callback"],
        name: "AuthHub Web Client",
      },
    });

    const publicClientId = "authhub-public-client";
    const publicClient = await prisma.oAuthClient.upsert({
      where: { clientId: publicClientId },
      update: {},
      create: {
        clientId: publicClientId,
        clientSecretHash: "", // No secret needed
        isPublic: true,
        scopes: ["openid", "profile"],
        redirectUris: ["http://localhost:3000/callback"],
        name: "AuthHub Public Client",
      },
    });

    console.log("OAuth Clients Seeded:");
    console.log(`[Confidential] Client ID: ${client.clientId} | Secret: ${clientSecret}`);
    console.log(`[Public] Client ID: ${publicClient.clientId} | No Secret Required`);
  } catch (error) {
    console.error("Error seeding client:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seedClient();
