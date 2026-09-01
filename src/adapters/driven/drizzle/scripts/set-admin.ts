import { config } from "dotenv";
config({ path: ".env.local" });

// One-off bootstrap: promote an existing real user to admin.
// Kept separate from seed.ts on purpose — this mutates a real user's row and
// must never run as part of routine fake-data seeding.
async function main() {
  const { db } = await import("../client");
  const { user } = await import("../schema/auth-schema");
  const { eq } = await import("drizzle-orm");

  const email = "e22kpg@gmail.com";
  const [updated] = await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, email))
    .returning({ id: user.id, email: user.email, role: user.role });

  if (!updated) {
    console.error(`No user found with email ${email} — nothing was updated.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Set role=admin for ${updated.email} (id: ${updated.id})`);
}

main();
