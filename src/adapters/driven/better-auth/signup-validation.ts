/*
 * ด่านตรวจข้อมูลผู้สมัคร — ตัวตัดสินใจของ user.validateUserInfo ใน auth.ts
 *
 * ★ ทำไมต้องแยกไฟล์ออกมาจาก auth.ts:
 *   ตอนอยู่ใน object config ของ betterAuth() มันเทสต์ไม่ได้เลย เพราะการ import auth.ts
 *   ลาก drizzle client กับการต่อฐานข้อมูลตามมาทั้งกอง กฎที่กันคนสมัครมั่วจึงไม่เคยมี
 *   เทสต์ครอบสักตัว ทั้งที่เป็นด่านเดียวที่กันได้จริง
 *
 *   แยกมาแล้วที่นี่ไม่ import อะไรที่แตะ I/O เลย เทสต์จึงเรียกตรงๆ ได้ทุกเคส
 *
 * ★ ไฟล์นี้ห้ามใส่ "server-only" ด้วยเหตุผลเดียวกับ signup-policy.ts —
 *   auth.ts import ไฟล์นี้ และ seed.ts import auth.ts ต่ออีกที ซึ่งรันด้วย tsx
 *   เป็นสคริปต์ Node ธรรมดา ไม่ใช่ใน runtime ของ Next
 */

import { affiliationProblem, emailDomainProblem } from "@/core/domain/account-rules";
import { isAdminProvisioning } from "./provisioning-context";
import { allowedSignupDomains } from "./signup-policy";

/** ข้อมูลผู้ใช้เท่าที่ด่านนี้สนใจ — รับเป็น unknown เพราะมาจาก request ที่ยังไม่ถูกตรวจ */
export interface SignupCandidate {
  email?: unknown;
  affiliation?: unknown;
}

/** better-auth บอกมาว่า hook ถูกเรียกจากจังหวะไหน */
export interface SignupSource {
  action: string;
}

/** รูปแบบคำตอบที่ better-auth เข้าใจว่าเป็น "ปฏิเสธ" (ตอบ 403 กลับไป) */
export interface SignupRejection {
  error: string;
  errorDescription: string;
}

/**
 * คืนเหตุผลที่ปฏิเสธ หรือ `undefined` ถ้าให้ผ่าน
 *
 * ★ ตรวจเฉพาะตอน "สร้างบัญชี" เท่านั้น ไม่ใช่ทุกครั้งที่ hook ถูกเรียก
 *   hook นี้ทำงานตอน sign-in ด้วย ถ้าตรวจกฎตรงนั้นด้วย บัญชีเดิมที่ข้อมูลไม่ตรงกฎปัจจุบัน
 *   จะล็อกอินไม่ได้อีกเลยทันทีที่ deploy — กลายเป็นการไล่คนที่ใช้งานอยู่ออกจากระบบ
 *   ทั้งที่กฎพวกนี้ตั้งใจคุมแค่ว่า "ใครสมัครใหม่ได้"
 *   และไม่มีช่องโหว่ เพราะบัญชีใหม่ทุกบัญชีต้องผ่าน action นี้เสมอ
 */
export function signupRejection(
  user: SignupCandidate,
  source: SignupSource,
): SignupRejection | undefined {
  if (source.action !== "create-user") return undefined;

  /*
   * ★ ยกเว้นกฎโดเมนเฉพาะตอน admin สร้างบัญชีให้คนอื่น (ดู provisioning-context.ts)
   *
   *   คนที่ไม่มีอีเมล @rtarf.mi.th ต้องเข้าระบบได้ แต่ต้องมี admin เป็นคนพาเข้ามา
   *   ไม่ใช่เปิดโดเมนสาธารณะให้สมัครเองได้
   *
   *   เครื่องหมายนี้ตั้งได้จากโค้ดฝั่ง server ของเราเท่านั้น ส่งมาจาก request ไม่ได้
   *   ถ้าเป็นฟิลด์ใน body ใครก็ยิงมาเองแล้วปิดกฎนี้ทิ้งได้
   *
   *   ★ ยกเว้นแค่ "กฎโดเมน" เท่านั้น กฎอื่นยังบังคับเหมือนเดิม — การที่ admin
   *     เป็นคนพาเข้ามา ไม่ได้แปลว่าข้อมูลที่กรอกจะถูกต้องโดยอัตโนมัติ
   */
  if (!isAdminProvisioning()) {
    const email = typeof user.email === "string" ? user.email : "";
    const domainIssue = emailDomainProblem(email, allowedSignupDomains());
    if (domainIssue) {
      return { error: "email_domain_not_allowed", errorDescription: domainIssue };
    }
  }

  /*
   * ★ สังกัดต้องบังคับที่นี่ ไม่ใช่แค่ required บน <input> ของฟอร์มสมัคร
   *   /api/auth/sign-up/email เป็น endpoint สาธารณะที่ยิงตรงด้วย curl ได้
   *   ถ้าตรวจแค่ฝั่งเบราว์เซอร์ การไม่ส่งฟิลด์นี้มาเลยจะสร้างบัญชีที่สังกัดเป็น null ได้
   *   ซึ่งทำให้หน้าจัดการสิทธิ์แสดง "ไม่ได้ระบุ" โดยที่ admin ไม่มีทางรู้ว่าคนนี้เป็นใคร
   *
   *   ปลอดภัยที่จะบังคับเข้ม เพราะ source.action ถูกกรองไปแล้วข้างบน — บัญชีเก่า
   *   ที่สมัครไว้ก่อนมีช่องนี้เดินมาไม่ถึงบรรทัดนี้ตอน sign-in จึงไม่มีใครถูกล็อกออก
   */
  const affiliation = typeof user.affiliation === "string" ? user.affiliation : "";
  const affiliationIssue = affiliationProblem(affiliation);
  if (affiliationIssue) {
    return { error: "invalid_affiliation", errorDescription: affiliationIssue };
  }

  return undefined;
}
