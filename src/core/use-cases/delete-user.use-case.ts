import { ForbiddenError, UserNotFoundError } from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { UserRepository } from "@/core/ports/user-repository.port";

export interface DeleteUserDeps {
  users: UserRepository;
}

export interface DeleteUserInput {
  actingUser: AuthenticatedUser;
  targetUserId: string;
}

/*
 * ปฏิเสธคำขอสมัคร = ลบบัญชีทิ้ง — admin เท่านั้น
 *
 * ★ ตรวจว่ามีตัวตนก่อนลบ ไม่ใช่ยิง delete ไปตรงๆ แล้วถือว่าสำเร็จ
 *   เพราะ admin ต้องรู้ว่ากดปฏิเสธคนที่คนอื่นเพิ่งจัดการไปแล้ว ไม่ใช่เห็นว่า "สำเร็จ"
 *   ทั้งที่ไม่ได้เกิดอะไรขึ้นเลย
 *
 * ★ ห้ามลบตัวเอง — กันเคสที่ admin คนเดียวของระบบลบตัวเองแล้วไม่มีใครเข้าหน้าจัดการได้อีก
 *
 * ★ ตั้งใจให้ลบได้ทุกสถานะ ไม่ใช่เฉพาะ pending: บัญชีที่อนุมัติไปแล้วแต่ภายหลังพบว่า
 *   ไม่ควรมีสิทธิ์ ก็ต้องเอาออกได้ ส่วนการ "พักไว้ก่อน" มี setUserStatus ให้ใช้อยู่แล้ว
 *   ซึ่งปลอดภัยกว่าและควรเป็นตัวเลือกแรกเสมอ
 */
export function makeDeleteUser(deps: DeleteUserDeps) {
  return async function deleteUser(input: DeleteUserInput): Promise<void> {
    if (input.actingUser.role !== "admin") {
      throw new ForbiddenError();
    }
    if (input.targetUserId === input.actingUser.id) {
      throw new ForbiddenError("ไม่สามารถลบบัญชีของตัวเองได้");
    }

    const target = await deps.users.findById(input.targetUserId);
    if (!target) {
      throw new UserNotFoundError(input.targetUserId);
    }

    await deps.users.delete(input.targetUserId);
  };
}
