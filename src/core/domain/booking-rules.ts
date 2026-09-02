/*
 * กฎเวลาของการจอง — เป็นกฎธุรกิจ ไม่ใช่เรื่องหน้าตา จึงอยู่ใน core
 *
 * ก่อนหน้านี้ค่าพวกนี้อยู่ที่ ui/time-utils.ts ที่เดียว ซึ่งฝั่ง UI ใช้สร้างตัวเลือกเวลา
 * แต่ core เอามาใช้บังคับจริงไม่ได้ (core ห้าม import จาก components)
 * ผลคือ "เวลาทำการ 08:00-18:00" เป็นแค่คำแนะนำในหน้าจอ ยิง action ตรงๆ ก็จองตี 3 ได้
 *
 * ตอนนี้ค่าอยู่ที่นี่ แล้ว ui/time-utils.ts re-export ต่อ — ยังมีแหล่งเดียวเหมือนเดิม
 * แต่กฎถูกบังคับจากฝั่ง server จริง
 */

export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 18;
export const SLOT_MINUTES = 30;

/*
 * หมายเหตุ: ไม่มีกฎ "ความยาวสูงสุด" แยกต่างหาก เพราะ isWithinBusinessHours บังคับให้
 * อยู่ในวันเดียวกันและอยู่ในช่วง 08:00-18:00 อยู่แล้ว ความยาวจึงเกิน 10 ชม. ไม่ได้โดยปริยาย
 * ถ้าวันหนึ่งอยากจำกัดให้สั้นกว่านั้น (เช่นห้ามจองเกิน 4 ชม.) ค่อยเพิ่มตรงนี้พร้อมเทสต์
 */

/** อยู่ในวันเดียวกันและอยู่ในช่วงเวลาทำการทั้งหัวและท้าย */
export function isWithinBusinessHours(start: Date, end: Date): boolean {
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (!sameDay) return false;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  return startMinutes >= OPEN_HOUR * 60 && endMinutes <= CLOSE_HOUR * 60;
}
