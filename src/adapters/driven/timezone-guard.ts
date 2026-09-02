/*
 * ด่านตรวจ timezone ของ process
 *
 * ระบบนี้ตีความคำว่า "เวลาท้องถิ่น" เป็นเวลาท้องถิ่นของ process ที่รันอยู่
 * ถ้า production รันเป็น UTC (ค่าตั้งต้นของ host ส่วนใหญ่) ทุกอย่างที่อิง "ตอนนี้"
 * จะคลาดไป 7 ชั่วโมง — isBusyNow บอกว่าห้องว่างทั้งที่กำลังประชุมอยู่
 * และเส้นเวลาปัจจุบันในปฏิทินหายไปทั้งช่วงเช้า
 *
 * ★ จุดที่อันตรายคือมัน "หลอกตา": ป้ายเวลาบนหน้าจอจะยังดูถูกต้องทุกอย่าง
 *   เพราะตอนเก็บกับตอนอ่านใช้ offset ผิดตัวเดียวกัน เลยหักล้างกันพอดี
 *   คนจะไม่รู้ตัวจนกว่าจะมีคนเดินไปถึงห้องแล้วเจอว่ามีคนใช้อยู่
 *
 * จึงเลือกให้ "ดังตั้งแต่ตอนสตาร์ท" ดีกว่าปล่อยให้ผิดเงียบๆ ไปเป็นเดือน
 *
 * หมายเหตุ: ที่นี่ใช้ Intl.DateTimeFormat ได้ ไม่ขัดกับกฎใน CLAUDE.md
 * เพราะกฎนั้นห้ามใช้กับ "ข้อความที่ถูก SSR" เพื่อกัน hydration mismatch
 * ส่วนตรงนี้เป็นการตรวจตอนสตาร์ทฝั่ง server ล้วน ไม่มีอะไรถูกเรนเดอร์ออกไป
 */

export const APP_TIMEZONE = "Asia/Bangkok";

/**
 * คืนข้อความปัญหา หรือ `null` ถ้าไม่มีปัญหา
 *
 * แยกเป็นฟังก์ชันบริสุทธิ์เพื่อให้เขียนเทสต์ได้โดยไม่ต้องไปยุ่งกับ process จริง
 */
export function timezoneProblem(resolved: string | undefined): string | null {
  if (!resolved) {
    return "อ่าน timezone ของ process ไม่ได้";
  }
  if (resolved !== APP_TIMEZONE) {
    return `process กำลังรันด้วย timezone "${resolved}" ไม่ใช่ "${APP_TIMEZONE}"`;
  }
  return null;
}

function resolveTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/**
 * ตรวจตอน server เริ่มทำงาน — production ให้ล้มไปเลย ส่วน dev แค่เตือน
 *
 * ที่ production ต้องล้ม เพราะความผิดพลาดแบบนี้ไม่มีอาการให้เห็นระหว่างใช้งาน
 * ล้มตอน deploy คือจังหวะเดียวที่คนจะสังเกตเห็นและแก้ได้ทันที
 * ส่วนตอน dev แค่เตือนพอ จะได้ไม่ขวางคนที่เครื่องตั้ง timezone อื่นไว้
 */
export function assertAppTimezone(): void {
  const problem = timezoneProblem(resolveTimezone());
  if (!problem) return;

  const detail =
    `${problem}\n` +
    `  ตั้ง TZ=${APP_TIMEZONE} ใน environment variables ของ host ก่อนใช้งานจริง\n` +
    `  ถ้าไม่ตั้ง เวลาทั้งระบบจะคลาดไปตาม offset โดยที่หน้าจอยังดูปกติทุกอย่าง`;

  if (process.env.NODE_ENV === "production") {
    throw new Error(`[timezone] ${detail}`);
  }

  console.warn(`[timezone] ${detail}`);
}
