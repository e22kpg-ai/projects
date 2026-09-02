import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/adapters/driven/drizzle/client";
import * as schema from "@/adapters/driven/drizzle/schema/schema";
import { affiliationProblem, emailDomainProblem } from "@/core/domain/account-rules";
import { allowedSignupDomains } from "./signup-policy";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: {
    enabled: true,
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
     * ด่านจริงของกฎ "สมัครได้เฉพาะอีเมลหน่วยงาน"
     *
     * ★ ทำไมต้องอยู่ตรงนี้ ไม่ใช่แค่ใน Server Action ของฟอร์มสมัคร:
     *   /api/auth/sign-up/email เป็น endpoint สาธารณะที่ยิงตรงได้ด้วย curl
     *   การตรวจในฟอร์มหรือใน action กันได้แค่คนที่เดินผ่านหน้าเว็บเท่านั้น
     *   hook นี้อยู่บนเส้นทางที่ทุกวิธีสมัครต้องผ่าน จึงเป็นที่เดียวที่กันได้จริง
     *
     * ★ ตัวกฎการเทียบโดเมนอยู่ใน core ที่นี่แค่ประกอบร่าง: ถามนโยบายว่าอนุญาตโดเมนไหน
     *   แล้วส่งให้ core ตัดสิน — core จึงไม่ต้องรู้จัก NODE_ENV และเทสต์ได้โดยไม่ต้องมี env
     *
     * ★ ตรวจเฉพาะตอน "สร้างบัญชี" เท่านั้น ไม่ใช่ทุกครั้งที่ hook ถูกเรียก
     *   hook นี้ทำงานตอน sign-in ด้วย ถ้าเช็คโดเมนตรงนั้นด้วย บัญชีเดิมที่โดเมนไม่ตรงกฎ
     *   จะล็อกอินไม่ได้อีกเลยทันทีที่ deploy — กลายเป็นการไล่คนที่ใช้งานอยู่ออกจากระบบ
     *   ทั้งที่กฎนี้ตั้งใจคุมแค่ว่า "ใครสมัครใหม่ได้"
     *   และไม่มีช่องโหว่ เพราะบัญชีใหม่ทุกบัญชีต้องผ่าน action นี้เสมอ
     *
     * คืน { error } เพื่อปฏิเสธ (better-auth ตอบ 403) คืน undefined เพื่อปล่อยผ่าน
     */
    validateUserInfo: async ({ user, source }) => {
      if (source.action !== "create-user") return undefined;

      const email = typeof user.email === "string" ? user.email : "";
      const domainIssue = emailDomainProblem(email, allowedSignupDomains());
      if (domainIssue) {
        return { error: "email_domain_not_allowed", errorDescription: domainIssue };
      }

      /*
       * สังกัดบังคับกรอกเฉพาะตอนสมัครใหม่ ไม่ใช่ทุกครั้งที่ validate
       * (hook นี้ถูกเรียกตอน sign-in ด้วย ถ้าบังคับทุกครั้ง บัญชีเก่าที่ยังไม่มีสังกัด
       *  จะล็อกอินไม่ได้อีกเลยทั้งที่ admin อนุมัติไปแล้ว)
       */
      const affiliation = user.affiliation;
      if (typeof affiliation === "string" && affiliation.trim().length > 0) {
        const affiliationIssue = affiliationProblem(affiliation);
        if (affiliationIssue) {
          return { error: "invalid_affiliation", errorDescription: affiliationIssue };
        }
      }

      return undefined;
    },
  },
});
