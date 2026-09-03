import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

/*
 * ★ `import type` เท่านั้นสำหรับ auth — ห้ามเป็น import ปกติเด็ดขาด
 *
 *   ไฟล์นี้ทำงานฝั่ง browser ส่วน auth.ts ลากทั้ง drizzle, client ของ Turso และ
 *   signup-policy ที่ติด "server-only" มาด้วย ถ้า import แบบมีค่า build จะพัง
 *   (ซึ่งยังนับว่าโชคดี) หรือแย่กว่านั้นคือลาก config ของฝั่ง server ไปอยู่ใน bundle สาธารณะ
 *
 *   inferAdditionalFields ใช้แค่ "รูปร่างของ type" ตอน compile ไม่ได้ใช้ค่าจริงตอน runtime
 *   บรรทัด import type จึงถูกลบทิ้งทั้งบรรทัดตอน build เหลือแต่ชนิดข้อมูลที่ TypeScript รู้
 *
 * ผลที่ได้คือ authClient.signUp.email() ยอมรับ `affiliation` และตรวจ type ให้ด้วย
 * ถ้าไม่มีบรรทัดนี้ ฟิลด์ที่เพิ่มใน additionalFields จะถูก TypeScript ปฏิเสธ
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
