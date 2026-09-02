import { config } from "dotenv";
config({ path: ".env.local" });

/*
 * ★ สคริปต์นี้สร้างบัญชีทดสอบที่ "รหัสผ่านเป็นที่รู้กัน" (ดู dev-user.ts)
 *   ถ้าเผลอรันใส่ฐานข้อมูลจริง = เปิดประตูให้ใครก็ได้เข้าระบบทันที
 *   จึงบังคับให้ชี้ไปที่ไฟล์ในเครื่อง (file:) เท่านั้น เว้นแต่จะยืนยันด้วย ALLOW_REMOTE_SEED=1
 */
function assertLocalDatabase() {
  const url = process.env.TURSO_DATABASE_URL ?? "";

  if (url.startsWith("file:")) return;
  if (process.env.ALLOW_REMOTE_SEED === "1") {
    console.warn(`⚠ Seeding a NON-LOCAL database: ${url}`);
    return;
  }

  console.error(
    `Refusing to seed a non-local database.\n` +
      `  TURSO_DATABASE_URL = ${url || "(unset)"}\n` +
      `  Seeding creates the dev account from dev-user.ts, whose password is public.\n` +
      `  Set ALLOW_REMOTE_SEED=1 only if you are certain this is what you want.`,
  );
  process.exit(1);
}

// Dynamic imports so dotenv finishes loading .env.local before ./client reads
// process.env at module-evaluation time (static imports are hoisted and would
// run before the config() call above).
async function main() {
  assertLocalDatabase();

  const { db } = await import("./client");
  const { rooms } = await import("./schema/app-schema");

  /*
   * id คงที่ ไม่ใช่ crypto.randomUUID() — ไม่งั้น onConflictDoNothing() จะไม่มีอะไรให้ชน
   * (rooms ไม่มี unique constraint บน name) แล้วการรันซ้ำจะได้ห้องซ้ำเพิ่มมาทุกครั้ง
   */
  const sampleRooms = [
    { id: "seed-room-ocean", name: "Ocean Room", location: "ชั้น 3", capacity: 8 },
    { id: "seed-room-sky", name: "Sky Room", location: "ชั้น 5", capacity: 4 },
    { id: "seed-room-garden", name: "Garden Room", location: "ชั้น 1", capacity: 12 },
    { id: "seed-room-focus", name: "Focus Pod", location: "ชั้น 2", capacity: 2 },
  ];

  await db.insert(rooms).values(sampleRooms).onConflictDoNothing();
  console.log(`Seeded ${sampleRooms.length} rooms.`);

  const { auth } = await import("../better-auth/auth");
  const { DEV_USERS } = await import("../better-auth/dev-users-config");
  const { user: userTable } = await import("../drizzle/schema/auth-schema");
  const { eq } = await import("drizzle-orm");

  for (const devUser of DEV_USERS) {
    try {
      await auth.api.signUpEmail({
        body: { email: devUser.email, password: devUser.password, name: devUser.name },
      });
      console.log(`Seeded user: ${devUser.email} (role: ${devUser.role})`);
    } catch (err) {
      /* กลืนเฉพาะเคส "มีบัญชีนี้อยู่แล้ว" — error อื่นต้องดังให้ได้ยิน ไม่ใช่รายงานว่าสำเร็จ */
      const message = err instanceof Error ? err.message : String(err);
      if (/exist/i.test(message)) {
        console.log(`User already exists, skipping: ${devUser.email}`);
      } else {
        throw err;
      }
    }

    // ตั้ง role ตามค่าใน config
    if (devUser.role !== "user") {
      await db.update(userTable).set({ role: devUser.role }).where(eq(userTable.email, devUser.email));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
