/**
 * type ที่ใช้ร่วมกันทั้ง ui/
 *
 * ไฟล์นี้เป็น barrel ได้ตัวเดียวในโฟลเดอร์นี้ เพราะมีแต่ type ล้วน
 * `isolatedModules` ทำให้ import type ถูก erase ตอน build จึงไม่มีต้นทุน runtime
 * และไม่ลาก client boundary ติดไปด้วย (component ห้ามทำ barrel — import ลึกเท่านั้น)
 */

export type Size = "sm" | "md" | "lg";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface SelectOption {
  value: string;
  /** ต้องเป็น string ไม่ใช่ ReactNode เพราะ typeahead ต้องเทียบข้อความ และ trigger ต้องเอาไปแสดง */
  label: string;
  disabled?: boolean;
}

/** วันที่รูปแบบ `YYYY-MM-DD` (ค.ศ. เสมอ — ดู date-utils.ts) */
export type ISODate = string;

/** เวลารูปแบบ `HH:MM` 24 ชั่วโมง zero-padded */
export type TimeString = string;
