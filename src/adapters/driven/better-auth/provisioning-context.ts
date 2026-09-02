import { AsyncLocalStorage } from "node:async_hooks";

/*
 * เครื่องหมายบอกว่า "การสร้างบัญชีครั้งนี้ admin เป็นคนทำให้"
 *
 * ใช้ยกเว้นกฎโดเมนอีเมลเฉพาะเส้นทางนี้เส้นทางเดียว — คนที่ไม่มีอีเมล @rtarf.mi.th
 * (ลูกจ้าง หน่วยงานภายนอกที่มาร่วมประชุม คนที่ยังไม่ได้รับ account ของหน่วย)
 * ต้องเข้าระบบได้ โดยไม่ต้องเปิดโดเมนสาธารณะอย่าง gmail.com ให้คนทั้งโลกสมัครเอง
 *
 * ★ ทำไมใช้ AsyncLocalStorage ไม่ใช่ flag ใน body ที่ส่งเข้า signUpEmail:
 *   อะไรก็ตามที่เดินทางมากับ request ปลอมได้ ถ้าเป็นฟิลด์ใน body ก็แค่ยิง
 *   POST /api/auth/sign-up/email พร้อม {"provisionedByAdmin":true} แล้วกฎโดเมนก็หายไป
 *   ส่วนค่าใน AsyncLocalStorage อยู่ในหน่วยความจำของ process และถูกตั้งได้จาก
 *   โค้ดฝั่ง server ของเราเองเท่านั้น ไม่มีทางส่งมาจากข้างนอก
 *
 * ★ ขอบเขตแคบที่สุดเท่าที่ทำได้: เปิดเฉพาะช่วงที่ createUser use-case ทำงานอยู่
 *   (ซึ่งตรวจแล้วว่าผู้เรียกเป็น admin) พอ callback จบ ค่าก็หายไปเอง
 *   ไม่มีสถานะค้างให้ request อื่นเผลอหยิบไปใช้
 */
const provisioningStore = new AsyncLocalStorage<true>();

/** รัน `fn` โดยถือว่าเป็นการสร้างบัญชีที่ admin เป็นคนทำให้ */
export function runAsAdminProvisioning<T>(fn: () => Promise<T>): Promise<T> {
  return provisioningStore.run(true, fn);
}

/** ตอนนี้อยู่ในขอบเขตของการสร้างบัญชีโดย admin หรือไม่ */
export function isAdminProvisioning(): boolean {
  return provisioningStore.getStore() === true;
}
