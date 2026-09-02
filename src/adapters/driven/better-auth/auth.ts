import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/adapters/driven/drizzle/client";
import * as schema from "@/adapters/driven/drizzle/schema/schema";
import { signupRejection } from "./signup-validation";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: {
    enabled: true,
  },

  /*
   * เก็บตัวนับ rate limit ไว้ในฐานข้อมูล ไม่ใช่ในหน่วยความจำของ process
   *
   * ★ ค่าตั้งต้นของ better-auth คือ "memory" ซึ่งบน serverless แทบไม่กันอะไรเลย
   *   แต่ละ instance นับของตัวเอง คนที่ยิงรัวๆ จะถูกกระจายไปหลาย instance
   *   แล้วได้โควตาใหม่ทุกครั้ง — กฎ "sign-in ได้ 3 ครั้งต่อ 10 วินาที" ที่ไลบรารี
   *   ตั้งมาให้จึงกลายเป็นแค่การชะลอ ไม่ใช่การกัน brute force จริง
   *
   * ★ ไม่ตั้ง advanced.ipAddress โดยตั้งใจ — ค่าตั้งต้นอ่าน x-forwarded-for อยู่แล้ว
   *   และจะเชื่อก็ต่อเมื่อ header มีค่าเดียว (ดู @better-auth/core/utils/ip)
   *   ซึ่งเป็นค่าตั้งต้นที่ปลอดภัยกว่าการไปประกาศ trustedProxies เอง
   *   ถ้าประกาศผิด คนข้างนอกจะปลอม header แล้วได้ bucket ใหม่ทุก request ทันที
   *   ถ้าหา IP ไม่ได้ ไลบรารีจะเตือนใน log แล้วตกไปใช้ bucket รวม ซึ่งเข้มเกินไป
   *   แต่ยังปลอดภัย — เจอ log นั้นเมื่อไหร่ค่อยมาตั้ง trustedProxies ให้ตรงกับ host จริง
   */
  rateLimit: {
    storage: "database",
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "user",
      },
      /*
       * ★ input: false เด็ดขาด — ถ้าเปิดให้ส่งเข้ามาได้ ใครก็ POST
       *   { status: "approved" } ไปที่ /api/auth/sign-up/email แล้วอนุมัติตัวเองได้ทันที
       *   ซึ่งทำให้ทั้งฟีเจอร์นี้ไม่มีความหมาย ค่านี้เปลี่ยนได้ทางเดียวคือผ่าน
       *   setUserStatus use-case ที่บังคับว่าผู้เรียกต้องเป็น admin
       */
      status: {
        type: "string",
        input: false,
        defaultValue: "pending",
      },
      /* สังกัดตรงกันข้าม — ผู้สมัครเป็นคนกรอกเอง จึงต้องรับเข้ามาได้ */
      affiliation: {
        type: "string",
        input: true,
        required: false,
      },
    },

    /*
     * ด่านจริงของกฎ "ใครสมัครใหม่ได้บ้าง"
     *
     * ★ ทำไมต้องอยู่ตรงนี้ ไม่ใช่แค่ใน Server Action ของฟอร์มสมัคร:
     *   /api/auth/sign-up/email เป็น endpoint สาธารณะที่ยิงตรงได้ด้วย curl
     *   การตรวจในฟอร์มหรือใน action กันได้แค่คนที่เดินผ่านหน้าเว็บเท่านั้น
     *   hook นี้อยู่บนเส้นทางที่ทุกวิธีสมัครต้องผ่าน จึงเป็นที่เดียวที่กันได้จริง
     *
     * ★ ตัวตัดสินใจอยู่ใน signup-validation.ts เพื่อให้เทสต์ครอบได้โดยไม่ต้องลาก
     *   drizzle client ตามมาทั้งกอง ที่นี่เหลือหน้าที่เดียวคือประกอบร่าง
     *
     * คืน { error } เพื่อปฏิเสธ (better-auth ตอบ 403) คืน undefined เพื่อปล่อยผ่าน
     */
    validateUserInfo: async ({ user, source }) => signupRejection(user, source),
  },
});
