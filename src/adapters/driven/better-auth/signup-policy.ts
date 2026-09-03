/*
 * นโยบายว่าอีเมลโดเมนไหนสมัครได้ — เป็นการตั้งค่าของ environment ไม่ใช่กฎของโดเมนธุรกิจ
 *
 * ตัวกฎการเทียบอยู่ใน core (`emailDomainProblem`) ที่นี่มีหน้าที่เดียวคือตอบว่า
 * "ตอนนี้อนุญาตโดเมนไหนบ้าง" แล้วส่งรายการนั้นเข้าไปให้ core ตัดสิน
 *
 * ★ ไฟล์นี้ตั้งใจไม่ใส่ "server-only" ต่างจาก dev-user.ts
 *
 *   auth.ts import ไฟล์นี้ และ seed.ts ก็ import auth.ts ต่ออีกที ซึ่งรันด้วย tsx เป็น
 *   สคริปต์ Node ธรรมดา ไม่ใช่ใน runtime ของ Next — "server-only" จะทำให้ npm run db:seed
 *   พังทันที (เหตุผลเดียวกับที่โปรเจกต์นี้แยก dev-users-config.ts ออกมาจาก dev-user.ts)
 *
 *   และไม่มีอะไรต้องปิดบังจริงๆ ด้วย: รายการโดเมนไม่ใช่ความลับ ฟอร์มสมัครแสดงให้ผู้ใช้
 *   เห็นตรงๆ อยู่แล้วว่าต้องใช้อีเมล @rtarf.mi.th ต่างจากรหัสผ่านใน dev-user.ts
 *   ที่หลุดไปฝั่ง client แล้วเป็นเรื่องใหญ่
 */

/** โดเมนของหน่วยงาน — บังคับใช้ทั้ง production และ dev */
export const ORGANISATION_EMAIL_DOMAIN = "rtarf.mi.th";

/*
 * ★ ทำไม dev ถึงผ่อนได้:
 *   บัญชีทดสอบทั้งหมด (db:seed, ปุ่ม dev, e2e) ใช้ example.com / example.local
 *   ถ้าบังคับโดเมนจริงทุก environment จะต้องไปตั้งบัญชีปลอมบนโดเมนของหน่วยงานจริง
 *   ซึ่งแย่กว่ามาก — วันหนึ่งจะมีคนสับสนว่า dev@rtarf.mi.th เป็นคนจริงหรือของปลอม
 *
 * ★ ผูกกับ NODE_ENV ไม่ใช่ env var ของตัวเอง โดยตั้งใจ
 *   ถ้าเป็น env var ที่ตั้งเองได้ วันหนึ่งจะมีคนเผลอตั้งค่าผ่อนปรนไว้บน production
 *   แล้วไม่มีอะไรทักท้วงเลย ส่วน NODE_ENV=production ถูกกำหนดโดย build ไม่ใช่โดยคน
 */
const DEV_ONLY_DOMAINS = ["example.com", "example.local"] as const;

export function allowedSignupDomains(): readonly string[] {
  if (process.env.NODE_ENV === "production") {
    return [ORGANISATION_EMAIL_DOMAIN];
  }
  return [ORGANISATION_EMAIL_DOMAIN, ...DEV_ONLY_DOMAINS];
}
