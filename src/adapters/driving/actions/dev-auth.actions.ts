"use server";

/*
 * ทางลัดล็อกอิน/สมัครสำหรับตอน dev เท่านั้น
 *
 * ★ ทำไมต้องผ่าน server action แทนที่จะ import ค่าคงที่เข้าไปในฟอร์มตรงๆ:
 *   ของเดิม LoginForm/SignupForm import DEV_USER_PASSWORD มาใช้ ซึ่งถึงแม้ปุ่มจะถูก
 *   ตัดทิ้งด้วย process.env.NODE_ENV ตอน build จริง แต่ bundler ยัง "อุ้ม" ตัวโมดูล
 *   ค่าคงที่นั้นติดไปใน client chunk อยู่ดี — ยืนยันแล้วด้วย
 *   `grep devpassword123 .next/static/chunks/` ซึ่งเจอไฟล์ที่เปิดสาธารณะสองไฟล์
 *
 *   พอย้ายมาไว้ฝั่ง server ค่าจะไม่มีทางถูก bundle ไปฝั่ง client ไม่ว่ากรณีใด
 *   และถึงมีคนยิง action นี้บน production ก็ถูกปฏิเสธตั้งแต่บรรทัดแรก
 */

export interface DevCredentials {
  email: string;
  password: string;
  name: string;
}

function assertNotProduction() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("dev auth shortcuts are disabled in production");
  }
}

/** คืนบัญชีทดสอบที่ `npm run db:seed` สร้างไว้ ให้ฟอร์มเอาไปล็อกอินต่อ */
export async function getDevLoginCredentials(): Promise<DevCredentials> {
  assertNotProduction();

  const { DEV_USER_EMAIL, DEV_USER_PASSWORD, DEV_USER_NAME } = await import(
    "@/adapters/driven/better-auth/dev-user"
  );

  return { email: DEV_USER_EMAIL, password: DEV_USER_PASSWORD, name: DEV_USER_NAME };
}

/** สร้างบัญชีทดสอบใหม่แบบสุ่ม ไม่ผูกกับบัญชีที่ seed ไว้ */
export async function getDevSignupCredentials(): Promise<DevCredentials> {
  assertNotProduction();

  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    email: `dev+${suffix}@example.local`,
    /* สุ่มใหม่ทุกครั้ง ไม่ใช้รหัสร่วมกับบัญชี seed */
    password: `dev-${Math.random().toString(36).slice(2, 12)}`,
    name: `Dev Tester ${suffix}`,
  };
}
