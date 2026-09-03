import type { AccountStatus } from "@/core/domain/account-rules";

export type Role = "user" | "admin";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /**
   * `pending` = สมัครแล้วแต่ admin ยังไม่อนุมัติ ล็อกอินได้แต่ใช้งานจริงไม่ได้
   *
   * ★ อยู่ใน AuthenticatedUser ไม่ใช่ต้องไปถาม repository ทีหลัง เพราะ use-case ทุกตัว
   *   ต้องเช็คค่านี้ ถ้าต้อง query เพิ่มทุกครั้งจะมีคนลืม แล้วช่องโหว่จะเงียบ
   */
  status: AccountStatus;
  /** สังกัดที่กรอกตอนสมัคร — `null` สำหรับบัญชีเก่าที่สมัครก่อนมีช่องนี้ */
  affiliation: string | null;
}

export interface AuthService {
  getCurrentUser(): Promise<AuthenticatedUser | null>;
}
