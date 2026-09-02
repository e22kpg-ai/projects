// TEMPORARY test-only script — promotes the most-recently-created local dev
// user to admin during manual browser verification. Delete when done.
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../client");
  const { user } = await import("../schema/auth-schema");
  const { desc, eq } = await import("drizzle-orm");

  const [latest] = await db.select().from(user).orderBy(desc(user.createdAt)).limit(1);
  if (!latest) {
    console.error("No users found");
    process.exitCode = 1;
    return;
  }

  const [updated] = await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.id, latest.id))
    .returning();

  console.log(`Promoted to admin: ${updated.email} (id: ${updated.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
