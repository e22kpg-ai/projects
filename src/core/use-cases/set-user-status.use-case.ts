import type { AccountStatus } from "@/core/domain/account-rules";
import { ForbiddenError, UserNotFoundError } from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { AppUser, UserRepository } from "@/core/ports/user-repository.port";

export interface SetUserStatusDeps {
  users: UserRepository;
}

export interface SetUserStatusInput {
  actingUser: AuthenticatedUser;
  targetUserId: string;
  status: AccountStatus;
}

/*
 * อนุมัติ (`approved`) หรือเพิกถอน (`pending`) สิทธิ์ใช้งานของผู้ใช้ — admin เท่านั้น
 *
 * ★ ห้ามเปลี่ยนสถานะของตัวเอง ด้วยเหตุผลเดียวกับที่ห้ามเปลี่ยน role ตัวเอง
 *   admin คนสุดท้ายที่เผลอกดเพิกถอนตัวเองจะล็อกทุกคนออกจากหน้าจัดการสิทธิ์ถาวร
 *   ไม่มีทางกลับเข้าไปแก้ได้อีกนอกจากไปแก้ที่ฐานข้อมูลตรงๆ
 *
 * ★ ใช้ use-case เดียวทำทั้งอนุมัติและเพิกถอน ไม่แยกเป็นสองตัว เพราะการ์ดชุดเดียวกันเป๊ะ
 *   ถ้าแยกไฟล์ วันที่มีคนเพิ่มกฎใหม่จะต้องจำให้ได้ว่าต้องแก้สองที่
 */
export function makeSetUserStatus(deps: SetUserStatusDeps) {
  return async function setUserStatus(input: SetUserStatusInput): Promise<AppUser> {
    if (input.actingUser.role !== "admin") {
      throw new ForbiddenError();
    }
    if (input.targetUserId === input.actingUser.id) {
      throw new ForbiddenError("ไม่สามารถเปลี่ยนสถานะของตัวเองได้");
    }

    const target = await deps.users.findById(input.targetUserId);
    if (!target) {
      throw new UserNotFoundError(input.targetUserId);
    }

    /*
     * ★ อีกครึ่งหนึ่งของกติกา "admin ⇒ approved" (ดู set-user-role.use-case.ts)
     *
     *   ถ้าปล่อยให้เพิกถอนสถานะของ admin ได้ตรงๆ จะเหลือ admin ที่เข้าระบบไม่ได้
     *   ซึ่งเป็นสภาพเดียวกับที่กฎนี้มีไว้กัน
     *
     *   บังคับให้ลดขั้นเป็นผู้ใช้ทั่วไปก่อน แล้วค่อยเพิกถอน — สองจังหวะแบบเดียวกับ
     *   ปุ่มปฏิเสธที่โผล่เฉพาะบัญชีที่ยังรออนุมัติ การถอนสิทธิ์ผู้ดูแลระบบ
     *   ควรเป็นการตัดสินใจที่มองเห็นได้ ไม่ใช่ผลข้างเคียงของการกดปุ่มเดียว
     */
    if (input.status === "pending" && target.role === "admin") {
      throw new ForbiddenError("ต้องลดขั้นเป็นผู้ใช้ทั่วไปก่อน จึงจะเพิกถอนสิทธิ์ได้");
    }

    const updated = await deps.users.updateAccess(input.targetUserId, { status: input.status });
    if (!updated) {
      throw new UserNotFoundError(input.targetUserId);
    }
    return updated;
  };
}
