/*
 * กฎของบัญชีผู้ใช้ — ใครสมัครได้ และสมัครแล้วใช้งานได้เมื่อไหร่
 *
 * อยู่ใน core เพราะเป็นกฎขององค์กร ไม่ใช่รายละเอียดของ Better Auth หรือของหน้าเว็บ
 * วันที่เปลี่ยนผู้ให้บริการ auth กฎพวกนี้ต้องอยู่ที่เดิมและยังบังคับได้เหมือนเดิม
 */

/**
 * สถานะการอนุมัติของบัญชี
 *
 * ★ `pending` ไม่ใช่ "ยังยืนยันอีเมลไม่เสร็จ" แต่แปลว่า "admin ยังไม่รับเข้าระบบ"
 *   คนที่อยู่สถานะนี้ล็อกอินได้ แต่ทำอะไรกับข้อมูลจริงไม่ได้เลย
 */
export type AccountStatus = "pending" | "approved";

export const MAX_AFFILIATION_LENGTH = 120;

/**
 * ผู้ใช้คนนี้ผ่านการอนุมัติแล้วหรือยัง
 *
 * รับเป็น object ไม่ใช่ string เปล่าๆ เพื่อให้ผู้เรียกส่ง user ทั้งก้อนเข้ามาได้
 * และกันการเผลอเทียบ `status === "approved"` กระจายอยู่หลายที่จนตกหล่นไปที่หนึ่ง
 */
export function isApproved(user: { status: AccountStatus }): boolean {
  return user.status === "approved";
}

/**
 * คืนข้อความปัญหา หรือ `null` ถ้าอีเมลอยู่ใน domain ที่อนุญาต
 *
 * ★ รับรายการ domain เข้ามาเป็นพารามิเตอร์ ไม่ได้อ่านจาก env เอง — core ห้ามรู้จัก
 *   environment ผู้เรียกเป็นคนตัดสินว่าตอนนี้อนุญาต domain ไหนบ้าง (ดู signup-policy.ts)
 *
 * ★ เทียบแบบ case-insensitive และตัดช่องว่างก่อนเสมอ เพราะคนกรอกอีเมลด้วยตัวใหญ่
 *   หรือมีช่องว่างติดท้ายมาจากการ copy-paste เป็นเรื่องปกติมาก ถ้าไม่ normalize
 *   จะถูกปฏิเสธทั้งที่อีเมลถูกต้อง แล้วเขาจะไม่มีทางรู้ว่าผิดตรงไหน
 */
export function emailDomainProblem(
  email: string,
  allowedDomains: readonly string[],
): string | null {
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return "รูปแบบอีเมลไม่ถูกต้อง";
  }

  const domain = normalized.slice(atIndex + 1);
  const allowed = allowedDomains.map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (allowed.length === 0) {
    return "ระบบยังไม่ได้กำหนดโดเมนอีเมลที่อนุญาต";
  }
  if (!allowed.includes(domain)) {
    /*
     * บอกไปเลยว่าต้องใช้ domain ไหน ไม่ใช่ "อีเมลไม่ถูกต้อง" เฉยๆ
     * คนที่ใช้อีเมลส่วนตัวสมัครจะได้รู้ทันทีว่าต้องกลับไปเอาอีเมลหน่วยงานมา
     * ไม่ใช่นั่งลองรหัสผ่านใหม่ไปเรื่อยๆ เพราะเดาว่าตัวเองพิมพ์อะไรผิด
     */
    return `สมัครได้เฉพาะอีเมลของหน่วยงาน (${allowed.map((d) => "@" + d).join(" หรือ ")})`;
  }
  return null;
}

/** คืนข้อความปัญหา หรือ `null` ถ้าสังกัดใช้ได้ */
export function affiliationProblem(affiliation: string): string | null {
  const trimmed = affiliation.trim();
  if (trimmed.length === 0) {
    return "กรุณาระบุสังกัด";
  }
  if (trimmed.length > MAX_AFFILIATION_LENGTH) {
    return `สังกัดต้องยาวไม่เกิน ${MAX_AFFILIATION_LENGTH} ตัวอักษร`;
  }
  return null;
}
