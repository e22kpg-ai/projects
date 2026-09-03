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

/** สิ่งที่แก้ได้ผ่านหน้าจัดการผู้ใช้ ส่งมาเฉพาะฟิลด์ที่ต้องการเปลี่ยน */
export interface UserAccessChanges {
  role?: Role;
  status?: AccountStatus;
}

export interface UserRepository {
  findAll(): Promise<AppUser[]>;
  findById(id: string): Promise<AppUser | undefined>;
  /**
   * แก้ role และ/หรือ status
   *
   * ★ เป็นเมธอดเดียวที่แก้ได้ทั้งคู่พร้อมกัน ไม่ได้แยกเป็น updateRole กับ updateStatus
   *   เพราะกฎ "admin ต้องเป็น approved เสมอ" ทำให้บางครั้งต้องเปลี่ยนสองฟิลด์พร้อมกัน
   *   ถ้าแยกเป็นสองคำสั่ง แล้วคำสั่งที่สองพลาด จะเหลือ admin ที่สถานะ pending ค้างอยู่
   *   ซึ่งคือสภาพพิกลที่กฎนี้มีไว้กันพอดี
   */
  updateAccess(id: string, changes: UserAccessChanges): Promise<AppUser | undefined>;
  /**
   * ลบบัญชีถาวร ใช้ตอน admin ปฏิเสธคำขอ
   *
   * ★ ไม่ใช่การ "ปิดการใช้งาน" — แถวใน account/session ถูก cascade ทิ้งไปด้วย
   *   กู้คืนไม่ได้ ฝั่งที่เรียกต้องให้ผู้ใช้ยืนยันก่อนเสมอ
   */
  delete(id: string): Promise<void>;
}
