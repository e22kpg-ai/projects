import type { AccountStatus } from "@/core/domain/account-rules";
import type { Role } from "@/core/ports/auth-service.port";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  /** `null` สำหรับบัญชีที่สมัครไว้ก่อนมีช่องสังกัด */
  affiliation: string | null;
  createdAt: Date;
}

export interface UserRepository {
  findAll(): Promise<AppUser[]>;
  findById(id: string): Promise<AppUser | undefined>;
  updateRole(id: string, role: Role): Promise<AppUser | undefined>;
  updateStatus(id: string, status: AccountStatus): Promise<AppUser | undefined>;
  /**
   * ลบบัญชีถาวร ใช้ตอน admin ปฏิเสธคำขอ
   *
   * ★ ไม่ใช่การ "ปิดการใช้งาน" — แถวใน account/session ถูก cascade ทิ้งไปด้วย
   *   กู้คืนไม่ได้ ฝั่งที่เรียกต้องให้ผู้ใช้ยืนยันก่อนเสมอ
   */
  delete(id: string): Promise<void>;
}
