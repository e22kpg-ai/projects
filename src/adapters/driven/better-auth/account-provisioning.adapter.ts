import type { AccountProvisioning, NewAccount } from "@/core/ports/account-provisioning.port";
import { InvalidSignupError } from "@/core/domain/errors";
import { auth } from "./auth";
import { runAsAdminProvisioning } from "./provisioning-context";

export class BetterAuthAccountProvisioning implements AccountProvisioning {
  async createAccount(input: NewAccount): Promise<{ id: string }> {
    /*
     * ห่อด้วย runAsAdminProvisioning เพื่อยกเว้นกฎโดเมนเฉพาะการเรียกครั้งนี้
     * (validateUserInfo ใน auth.ts เป็นคนอ่านเครื่องหมายนี้)
     *
     * ★ ขอบเขตแคบไว้แค่บรรทัดที่สร้างบัญชีจริงๆ ไม่ครอบทั้ง use-case
     *   ยิ่งเปิดสั้นเท่าไหร่ โอกาสที่โค้ดอื่นจะเผลอเข้ามาอยู่ในขอบเขตก็ยิ่งน้อย
     */
    const created = await runAsAdminProvisioning(async () => {
      try {
        return await auth.api.signUpEmail({
          body: {
            name: input.name,
            email: input.email,
            password: input.password,
            affiliation: input.affiliation,
          },
        });
      } catch (err) {
        /*
         * เคสที่เจอบ่อยที่สุดคืออีเมลซ้ำ ซึ่ง admin แก้เองได้ทันที
         * จึงแปลงเป็น DomainError เพื่อให้ action ส่งข้อความขึ้นฟอร์ม
         * แทนที่จะโยนต่อจน error boundary กินทั้งหน้าแล้วสิ่งที่กรอกไว้หายหมด
         */
        const message = err instanceof Error ? err.message : String(err);
        if (/exist/i.test(message)) {
          throw new InvalidSignupError("อีเมลนี้มีบัญชีอยู่แล้ว");
        }
        throw err;
      }
    });

    return { id: created.user.id };
  }
}
