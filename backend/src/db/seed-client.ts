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
        redirectUris: ["http://localhost:3000/callback", "https://oauth.pstmn.io/v1/callback"],
        name: "AuthHub Web Client",
      },
    });

    console.log("OAuth Client Seeded:");
    console.log(`Client ID: ${client.clientId}`);
    console.log(`Client Secret: ${clientSecret}`);
  } catch (error) {
    console.error("Error seeding client:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seedClient();
