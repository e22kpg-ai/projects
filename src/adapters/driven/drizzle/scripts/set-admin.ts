import { config } from "dotenv";
config({ path: ".env.local" });

// One-off bootstrap: promote an existing user to admin.
//   npm run db:set-admin -- someone@example.com
//
// Kept separate from seed.ts on purpose — this mutates a real user's row and
// must never run as part of routine fake-data seeding.
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error(
      "Usage: npm run db:set-admin -- <email>\n" +
        "  (add TURSO_DATABASE_URL/TURSO_AUTH_TOKEN inline to target another database)",
    );
    process.exit(1);
  }

  const { db } = await import("../client");
  const { user } = await import("../schema/auth-schema");
  const { eq } = await import("drizzle-orm");

  const [updated] = await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, email))
    .returning({ id: user.id, email: user.email, role: user.role });

  if (!updated) {
    console.error(`No user found with email ${email} — nothing was updated.`);
    process.exit(1);
  }

  console.log(`Set role=admin for ${updated.email} (id: ${updated.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
