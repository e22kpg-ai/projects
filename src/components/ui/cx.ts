/**
 * ต่อ className แบบสั้นที่สุดเท่าที่โปรเจกต์นี้ต้องการ — แทนการลง clsx เป็น dependency
 *
 * ไม่มี directive โดยตั้งใจ: ทั้ง Server Component และ Client Component ต้อง import ได้
 */
export type ClassValue = string | false | null | undefined;

export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
