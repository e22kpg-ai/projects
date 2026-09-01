import type { ISODate } from "./types";

/*
 * ฟังก์ชันวันที่ล้วน ไม่มี React ไม่มี directive — Server Component ต้อง import ได้
 *
 * ★ กฎเหล็กข้อที่ 1: ห้ามใช้ toISOString() คำนวณวันที่ในระบบนี้
 *   toISOString() แปลงเป็น UTC ก่อน ที่ไทย (+07:00) ตอนตี 3 ของวันที่ 1 ก.ย.
 *   จะได้ "2026-08-31" คือย้อนไปหนึ่งวันแบบเงียบๆ ไม่มี error ให้เห็น
 *   ของเดิมมีบั๊กนี้อยู่สองที่ (BookingForm min={today} และ CalendarView.shiftDate)
 *
 * ★ กฎเหล็กข้อที่ 2: เก็บและส่งเป็น ค.ศ. เสมอ แสดงผลเป็น พ.ศ. เท่านั้น
 *   ทุก wire format ในแอปเป็น ค.ศ. (booking.actions.ts ทำ new Date(`${date}T${time}:00`))
 *   ถ้าปล่อย พ.ศ. หลุดออกไปจะได้ record ที่ล้ำไปอนาคต 543 ปีโดยไม่มีใครรู้
 *   toBuddhistYear() จึงถูกเรียกได้แค่ใน formatThai* สองตัวข้างล่างเท่านั้น
 */

export const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

export const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

export const THAI_WEEKDAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

/** จำนวนช่องในตารางเดือน — คงที่ 6 แถว × 7 วัน เพื่อให้ popover ไม่เปลี่ยนความสูงตอนเปลี่ยนเดือน */
export const MONTH_GRID_CELLS = 42;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Date → "YYYY-MM-DD" ตามเวลาท้องถิ่น (ห้ามเปลี่ยนไปใช้ toISOString) */
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** "YYYY-MM-DD" → Date ที่เที่ยงคืนของวันนั้นตามเวลาท้องถิ่น */
export function parseISODate(iso: ISODate): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** บวก/ลบเดือนโดยหนีบวันที่ไม่ให้ล้นเดือน (31 ม.ค. + 1 เดือน = 28/29 ก.พ. ไม่ใช่ 2/3 มี.ค.) */
export function addMonths(iso: ISODate, months: number): ISODate {
  const date = parseISODate(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toISODate(date);
}

/** "YYYY-MM" ของเดือนที่วันนั้นอยู่ — ใช้เทียบว่าช่องไหนเป็นวันนอกเดือน */
export function monthKey(iso: ISODate): string {
  return iso.slice(0, 7);
}

/**
 * ตารางเดือนขนาด 42 ช่องเสมอ เริ่มจากวันอาทิตย์ของสัปดาห์แรก
 * รวมวันของเดือนก่อนและเดือนถัดไปด้วย เพื่อให้กดลูกศรเดินข้ามเดือนได้ต่อเนื่อง
 */
export function buildMonthGrid(anchor: ISODate): ISODate[] {
  const first = parseISODate(`${monthKey(anchor)}-01`);
  const start = addDays(toISODate(first), -first.getDay());
  return Array.from({ length: MONTH_GRID_CELLS }, (_, i) => addDays(start, i));
}

/** ISO เรียงตามพจนานุกรมตรงกับเรียงตามเวลาอยู่แล้ว จึงเทียบ string ตรงๆ ได้ */
export function isBefore(a: ISODate, b: ISODate): boolean {
  return a < b;
}

export function clampISODate(iso: ISODate, min?: ISODate, max?: ISODate): ISODate {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

export function isOutOfRange(iso: ISODate, min?: ISODate, max?: ISODate): boolean {
  return (min !== undefined && iso < min) || (max !== undefined && iso > max);
}

/* ── แสดงผลเป็น พ.ศ. — สองฟังก์ชันข้างล่างนี้เท่านั้นที่แตะปีพุทธได้ ── */

function toBuddhistYear(gregorianYear: number): number {
  return gregorianYear + 543;
}

/**
 * "1 กันยายน 2569"
 *
 * ไม่ใช้ Intl.DateTimeFormat("th-TH-u-ca-buddhist") โดยตั้งใจ —
 * ข้อความนี้ถูก render ตอน SSR ด้วย และ ICU ของ Node กับของ browser คนละเวอร์ชันกันได้
 * ผลคือ hydration mismatch แบบเงียบๆ เขียน array เองปลอดภัยกว่าและไม่ต้องพึ่งอะไรเพิ่ม
 */
export function formatThaiLong(iso: ISODate): string {
  const date = parseISODate(iso);
  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${toBuddhistYear(date.getFullYear())}`;
}

/** "1 ก.ย. 2569" */
export function formatThaiShort(iso: ISODate): string {
  const date = parseISODate(iso);
  return `${date.getDate()} ${THAI_MONTHS_SHORT[date.getMonth()]} ${toBuddhistYear(date.getFullYear())}`;
}

/** "กันยายน 2569" */
export function formatThaiMonthYear(iso: ISODate): string {
  const date = parseISODate(iso);
  return `${THAI_MONTHS[date.getMonth()]} ${toBuddhistYear(date.getFullYear())}`;
}
