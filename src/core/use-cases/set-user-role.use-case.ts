import { ForbiddenError, UserNotFoundError } from "@/core/domain/errors";
import type { AuthenticatedUser, Role } from "@/core/ports/auth-service.port";
import type { AppUser, UserAccessChanges, UserRepository } from "@/core/ports/user-repository.port";

export interface SetUserRoleDeps {
  users: UserRepository;
}

export interface SetUserRoleInput {
  actingUser: AuthenticatedUser;
  targetUserId: string;
  role: Role;
}

export function makeSetUserRole(deps: SetUserRoleDeps) {
  return async function setUserRole(input: SetUserRoleInput): Promise<AppUser> {
    if (input.actingUser.role !== "admin") {
      throw new ForbiddenError();
    }
    if (input.targetUserId === input.actingUser.id) {
      throw new ForbiddenError("ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้");
    }

    /*
     * ★ กติกา: admin ต้องเป็น approved เสมอ
     *
     *   เลื่อนคนที่ยังรออนุมัติขึ้นเป็น admin ได้ ถ้าไม่อนุมัติให้พร้อมกัน จะได้
     *   "admin ที่ใช้งานไม่ได้" — requireApprovedUser เด้งเขาไป /pending
     *   แล้วเขาจะบริหารอะไรไม่ได้เลยทั้งที่ป้ายบอกว่าเป็นผู้ดูแลระบบ
     *   คนที่กดเลื่อนขั้นก็จะงงว่าทำไมเลื่อนแล้วไม่มีอะไรเกิดขึ้น
     *
     *   การเลื่อนใครขึ้นเป็น admin คือการแสดงเจตนาว่าไว้ใจคนนั้นอยู่แล้ว
     *   จึงถือเป็นการอนุมัติไปในตัว ไม่ต้องให้กดสองครั้ง
     *
     *   ส่งไปพร้อมกันในคำสั่งเดียว ไม่ใช่ยิงสองรอบ ถ้ารอบที่สองพลาดจะเหลือสภาพที่ว่าไว้พอดี
     */
    const changes: UserAccessChanges =
      input.role === "admin" ? { role: "admin", status: "approved" } : { role: input.role };

    const updated = await deps.users.updateAccess(input.targetUserId, changes);
    if (!updated) {
      throw new UserNotFoundError(input.targetUserId);
    }
    return updated;
  };
}
