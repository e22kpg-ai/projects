import { affiliationProblem, isActiveAdmin } from "@/core/domain/account-rules";
import { ForbiddenError, InvalidSignupError, UserNotFoundError } from "@/core/domain/errors";
import type { AuthenticatedUser, Role } from "@/core/ports/auth-service.port";
import type { AccountProvisioning } from "@/core/ports/account-provisioning.port";
import type { AppUser, UserRepository } from "@/core/ports/user-repository.port";

export interface CreateUserDeps {
  provisioning: AccountProvisioning;
  users: UserRepository;
}

export interface CreateUserInput {
  actingUser: AuthenticatedUser;
  name: string;
  email: string;
  password: string;
  affiliation: string;
  role: Role;
}

/*
 * admin สร้างบัญชีให้คนที่ไม่มีอีเมลของหน่วยงาน — admin เท่านั้น
 *
 * ★ ทำไมต้องมีทางนี้ แทนที่จะเปิดโดเมนสาธารณะอย่าง gmail.com ใน allowlist:
 *   gmail.com สมัครฟรีได้ทั้งโลก ใส่เข้าไปแล้วด่านโดเมนจะไม่กรองใครออกอีกเลย
 *   เหลือด่านเดียวคือสายตาของ admin ที่ต้องไล่ดูรายชื่อคนแปลกหน้าทุกวัน
 *   ความปลอดภัยที่ขึ้นกับ "คนต้องไม่เผลอ" ทุกครั้งไม่เคยอยู่รอดในระยะยาว
 *
 *   ทางนี้กลับด้านกัน: ไม่มีใครสมัครเองได้ แต่ admin หยิบใครเข้ามาก็ได้เป็นรายคน
 *   ซึ่งตรงกับสิ่งที่เกิดขึ้นจริงในองค์กรมากกว่า
 *
 * ★ บัญชีที่สร้างทางนี้เป็น approved ทันที ไม่ต้องรออนุมัติซ้ำ
 *   การที่ admin นั่งกรอกฟอร์มสร้างให้ คือการอนุมัติไปแล้วในตัว
 *   ถ้าให้ไปรออนุมัติอีกรอบ admin จะต้องกดยืนยันสิ่งที่ตัวเองเพิ่งทำ ซึ่งไม่มีความหมาย
 */
export function makeCreateUser(deps: CreateUserDeps) {
  return async function createUser(input: CreateUserInput): Promise<AppUser> {
    if (!isActiveAdmin(input.actingUser)) {
      throw new ForbiddenError();
    }

    const affiliationIssue = affiliationProblem(input.affiliation);
    if (affiliationIssue) {
      throw new InvalidSignupError(affiliationIssue);
    }
    if (input.name.trim().length === 0) {
      throw new InvalidSignupError("กรุณาระบุชื่อ");
    }

    /*
     * ★ ตั้งใจไม่ตรวจโดเมนอีเมลตรงนี้ — นั่นคือทั้งหมดที่ทางนี้มีไว้ทำ
     *   กฎโดเมนคุมว่า "ใครสมัครเองได้" ส่วนตรงนี้คือ admin รับคนเข้ามาเป็นรายคน
     *   ซึ่งมีคนรับผิดชอบชัดเจนอยู่แล้ว
     */
    const { id } = await deps.provisioning.createAccount({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      affiliation: input.affiliation.trim(),
    });

    /*
     * บัญชีเกิดมาเป็น pending เสมอ (ค่าตั้งต้นของตาราง) จึงต้องสั่งอนุมัติต่ออีกที
     *
     * ★ ถ้าขั้นนี้พลาด จะเหลือบัญชีที่ pending ค้างอยู่ในรายการ ซึ่ง admin กดอนุมัติเองได้
     *   เป็นความเสียหายที่มองเห็นและแก้ได้ ต่างจากกรณี admin ที่ต้องอะตอมมิก
     *   จึงยอมให้เป็นสองคำสั่งได้ที่นี่
     */
    const updated = await deps.users.updateAccess(id, {
      role: input.role,
      status: "approved",
    });
    if (!updated) {
      throw new UserNotFoundError(id);
    }
    return updated;
  };
}
