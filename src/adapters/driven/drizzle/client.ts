import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema/schema";

/*
 * บอกให้ชัดว่าขาดตัวแปรอะไร — ของเดิมใช้ `!` เฉยๆ พอไม่ได้ตั้งค่า createClient จะพัง
 * ตั้งแต่ตอน evaluate module ซึ่งระหว่าง `next build` จะโผล่มาเป็น error ตอน collect page data
 * ที่อ่านไม่ออกเลยว่าสาเหตุจริงคือ env หาย
 */
const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL is not set — copy .env.example to .env.local and fill it in.",
  );
}

const libsqlClient = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(libsqlClient, { schema });
