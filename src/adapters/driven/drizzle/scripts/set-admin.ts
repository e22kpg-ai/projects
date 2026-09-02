import { config } from "dotenv";
config({ path: ".env.local" });

// One-off bootstrap: promote an existing user to admin.
//   npm run db:set-admin -- someone@example.com
//
// Kept separate from seed.ts on purpose — this mutates a real user's row and
// must never run as part of routine fake-data seeding.
//
// ★ ต้องตั้ง status เป็น approved ไปพร้อมกันเสมอ ห้ามตั้งแค่ role
//
//   กติกาของระบบคือ "admin ⇒ approved เสมอ" (ดู set-user-role.use-case.ts)
//   use-case ทั้งหมดของ admin ตรวจแค่ role เพราะเชื่อกติกาข้อนี้ ส่วน requireApprovedUser
//   เด้งคนที่ยัง pending ไป /pending ก่อนถึงหน้า /admin ด้วยซ้ำ
//
//   สคริปต์นี้คือทางเดียวที่จะมี admin คนแรกในระบบใหม่ และบัญชีที่เพิ่งสมัครทุกบัญชี
//   เริ่มที่ pending เสมอ ถ้าตั้งแค่ role จะได้ "admin ที่ใช้งานไม่ได้" ทันที —
//   เจ้าตัวถูกเด้งไป /pending เข้าหน้าจัดการสิทธิ์ไม่ได้ จึงไม่มีใครอนุมัติใครได้อีกเลย
//   ทั้งระบบตัน แก้ได้ทางเดียวคือไปแก้ฐานข้อมูลด้วยมือ
//
//   ตั้งสองค่าในคำสั่งเดียว ไม่ใช่ยิงสองรอบ ด้วยเหตุผลเดียวกับใน updateAccess:
//   ถ้ารอบที่สองพลาด จะเหลือสภาพที่กติกานี้มีไว้กันพอดี
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
    .set({ role: "admin", status: "approved" })
    .where(eq(user.email, email))
    .returning({ id: user.id, email: user.email, role: user.role, status: user.status });

  if (!updated) {
    console.error(`No user found with email ${email} — nothing was updated.`);
    process.exit(1);
  }

  console.log(
    `Set role=${updated.role} status=${updated.status} for ${updated.email} (id: ${updated.id})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
