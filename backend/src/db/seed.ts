import prisma from "./client.js";
import { hashPassword } from "../core/crypto.js";

const seed = async () => {
  try {
    console.log("Seeding database...");

    // 1. Create a Default Tenant
    const defaultTenant = await prisma.tenant.upsert({
      where: { id: "00000000-0000-0000-0000-000000000001" }, // Using a fixed UUID for easy reference
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "AuthHub Default Tenant",
        logoUrl: "https://authhub.com/logo.png",
        primaryColor: "#3B82F6",
        requireMfa: false,
        allowPasskeys: true,
      },
    });
    console.log(`[Tenant] Default Tenant created: ${defaultTenant.name}`);

    // 2. Create the first Admin User
    const adminEmail = "admin@authhub.local";
    const adminPassword = "SuperSecretPassword123!";
    const passwordHash = await hashPassword(adminPassword);

    let adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          emailVerified: true,
          roles: ["ADMIN", "USER"], // Give admin role
        },
      });
    } else {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: { roles: ["ADMIN", "USER"] }
      });
    }
    console.log(`[User] Admin user created: ${adminUser.email} / ${adminPassword}`);

    // 3. Create Default OAuth Clients
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
        redirectUris: ["http://localhost:5173/callback", "https://oauth.pstmn.io/v1/callback"],
        name: "AuthHub Web Client",
        tenantId: defaultTenant.id,
        ownerId: adminUser.id,
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
        redirectUris: ["http://localhost:5173/callback"],
        name: "AuthHub Public Client",
        tenantId: defaultTenant.id,
        ownerId: adminUser.id,
      },
    });

    console.log(`[OAuth] Confidential Client ID: ${client.clientId} | Secret: ${clientSecret}`);
    console.log(`[OAuth] Public Client ID: ${publicClient.clientId} | No Secret Required`);

    console.log("Database perfectly seeded!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
