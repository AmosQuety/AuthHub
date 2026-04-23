import prisma from "./client.js";
async function check() {
  console.log("Connecting to DB...");
  try {
    const tenants = await prisma.tenant.findMany();
    console.log("Tenants found:", tenants.length);
    if (tenants.length > 0) {
      tenants.forEach((t: any) => console.log(` - Tenant: ${t.name} (ID: ${t.id})`));
    } else {
      console.log("No tenants found in database.");
    }
    const users = await prisma.user.findMany({ select: { email: true, roles: true } });
    console.log("Users found:", users.length);
    users.forEach((u: any) => console.log(` - User: ${u.email} (Roles: ${u.roles})`));
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit(0);
  }
}
check();
