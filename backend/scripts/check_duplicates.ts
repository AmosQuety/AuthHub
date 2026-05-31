import prisma from "../src/db/client.js";

async function main() {
  console.log("Checking for duplicate emails in users table...");

  const duplicates = await prisma.$queryRaw`
    SELECT email, COUNT(*) as cnt
    FROM "users"
    GROUP BY email
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `;

  if ((duplicates as any[]).length === 0) {
    console.log("No duplicate emails found.");
  } else {
    console.log("Duplicate emails:");
    console.table(duplicates as any[]);
  }

  const targetEmail = process.argv[2] || "amosquety@gmail.com";
  console.log(`\nInspecting records for ${targetEmail} (lowercased):`);

  const users = await prisma.user.findMany({
    where: { email: targetEmail.toLowerCase() },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      tosAcceptedAt: true,
      tenantId: true,
      createdAt: true,
      profilePictureUrl: true,
      emailVerified: true,
      phoneNumber: true,
      tenant: { select: { id: true, name: true, clientId: true } },
      authProviders: { select: { provider: true, providerId: true, providerEmail: true } },
      sessions: { select: { id: true, createdAt: true, expiresAt: true } },
    },
  });

  if (users.length === 0) {
    console.log("No user found for that email.");
  } else {
    console.table(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phoneNumber: u.phoneNumber,
      emailVerified: u.emailVerified,
      tosAcceptedAt: u.tosAcceptedAt ? u.tosAcceptedAt.toISOString() : null,
      tenantId: u.tenantId,
      tenantName: u.tenant?.name ?? null,
      tenantClientId: u.tenant?.clientId ?? null,
      providers: u.authProviders.map(p => `${p.provider}:${p.providerEmail ?? p.providerId}`).join(", "),
      sessions: u.sessions.length,
      createdAt: u.createdAt.toISOString(),
      profilePictureUrl: u.profilePictureUrl,
    })));
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
