/*
 * ฮุกที่ Next เรียกครั้งเดียวตอน server เริ่มทำงาน — ที่เดียวที่ตรวจ config ระดับ process ได้
 *
 * จัดการ timezone ที่นี่ ไม่ใช่ในหน้าใดหน้าหนึ่ง เพราะปัญหานี้เป็นเรื่องของทั้ง process
 * ถ้าไปตรวจในหน้าจะได้ทั้งช้ากว่า (รู้ตอนมีคนเปิดหน้าแล้ว) และซ้ำซ้อนทุก request
 *
 * ★ ต้องอยู่ใน register() ซึ่ง Next เรียกก่อนรับ request แรกเสมอ
 *   ถ้าไปตั้งช้ากว่านั้น จะมีบาง request ที่คำนวณเวลาด้วย timezone เก่าไปแล้ว
 */
export async function register() {
  /* edge runtime ไม่มี timezone ของ process ให้ตั้งอยู่แล้ว และ proxy ก็ไม่ได้ยุ่งกับวันเวลา */
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ensureAppTimezone } = await import("@/adapters/driven/timezone-guard");
  ensureAppTimezone();
}
