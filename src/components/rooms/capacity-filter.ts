/*
 * ตัวกรองความจุห้อง — ตารางช่วง + ตัวเทียบ
 *
 * แยกออกมาจาก RoomBrowser เพราะตรงนี้เป็น logic ล้วน ไม่แตะ DOM ไม่ต้องมี state
 * อยู่นอกไฟล์ "use client" แล้วเขียนเทสต์ตรงๆ ได้ (ดู capacity-filter.test.ts)
 * ขอบช่วง 20/21, 40/41, 100/101 เป็นจุดที่ off-by-one ชอบมาเกิด และเป็นบั๊กที่
 * มองด้วยตาไม่เห็น เพราะห้องที่ตกร่องจะแค่ "ไม่โผล่" ไม่มี error อะไรให้จับ
 *
 * ⚠️ ห้ามใส่ "use client" ในไฟล์นี้ ตามกติกา helper module ของโปรเจกต์
 */

export interface CapacityBucket {
  value: string;
  label: string;
  min: number;
  max: number;
}

/*
 * เก็บ min/max ไว้คู่กับ label ในโครงเดียว เพราะถ้าแยกเป็นสองตารางแล้วแก้ที่เดียว
 * ป้ายกับเงื่อนไขจะเพี้ยนจากกันเงียบๆ โดยไม่มี type error ให้เห็น
 *
 * ช่องแรกเป็น "ทุกขนาด" (ครอบคลุมทุกค่า) และเป็นค่าตั้งต้น เพื่อไม่ให้ผู้ใช้ที่เพิ่งเปิดหน้ามา
 * เจอห้องใหญ่ถูกซ่อนอยู่ทั้งที่ยังไม่ได้กดกรองอะไรเลย ส่วนช่วงที่เหลือไม่ทับกัน
 * และต่อกันสนิท ไม่มีความจุไหนตกร่องจนหายไปจากทุกตัวกรอง
 */
export const CAPACITY_OPTIONS: CapacityBucket[] = [
  { value: "", label: "ความจุ: ทุกขนาด", min: 0, max: Number.POSITIVE_INFINITY },
  { value: "20", label: "ไม่เกิน 20 คน", min: 0, max: 20 },
  { value: "40", label: "21–40 คน", min: 21, max: 40 },
  { value: "100", label: "41–100 คน", min: 41, max: 100 },
  { value: "100+", label: "มากกว่า 100 คน", min: 101, max: Number.POSITIVE_INFINITY },
];

export const DEFAULT_CAPACITY = CAPACITY_OPTIONS[0].value;

export function matchesCapacity(capacity: number, bucket: string): boolean {
  const range = CAPACITY_OPTIONS.find((option) => option.value === bucket);
  if (!range) return true;
  return capacity >= range.min && capacity <= range.max;
}
