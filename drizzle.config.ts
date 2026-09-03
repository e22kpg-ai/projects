import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

/*
 * ★ เลือกไฟล์ env ได้ เพราะ migration ต้องรันกับ production ด้วย ไม่ใช่แค่ dev
 *
 *   ของเดิมล็อกไว้ที่ ".env.local" ตายตัว แปลว่า `npm run db:migrate` ยิงเข้า dev DB
 *   เสมอไม่ว่าจะตั้งใจอะไร ตอน deploy จริงจึงไม่มีคำสั่งไหนในโปรเจกต์ที่พา migration
 *   ขึ้น production ได้เลย ต้องไปประกอบ env เองข้างนอก ซึ่งเป็นขั้นตอนที่ไม่มีใครจดไว้
 *   แล้วก็ลืม — ตารางที่ migration สร้างจะหายไปเงียบๆ จนกว่าโค้ดใหม่จะไปเรียกแล้วพัง
 *
 *   ค่าตั้งต้นยังเป็น .env.local เหมือนเดิมโดยตั้งใจ: การรันพลาดต้องไปโดน dev
 *   ส่วนการแตะ production ต้องพิมพ์ออกมาให้เห็นเต็มๆ ว่ากำลังทำอะไรอยู่
 *
 *     ENV_FILE=.env.production.local npm run db:migrate
 *
 *   ไม่ทำเป็น npm script แยก (เช่น db:migrate:prod) โดยตั้งใจ — ชื่อสั้นๆ ที่กด
 *   ผิดได้ด้วยการเติมตัวอักษรไม่กี่ตัว ไม่ควรเป็นทางเข้าสู่ฐานข้อมูลจริง
 */
const envFile = process.env.ENV_FILE ?? ".env.local";
config({ path: envFile });

export default defineConfig({
  schema: "./src/adapters/driven/drizzle/schema/schema.ts",
  out: "./drizzle/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
