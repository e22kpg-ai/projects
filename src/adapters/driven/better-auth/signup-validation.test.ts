import { describe, expect, it } from "vitest";
import { MAX_AFFILIATION_LENGTH } from "@/core/domain/account-rules";
import { runAsAdminProvisioning } from "./provisioning-context";
import { ORGANISATION_EMAIL_DOMAIN } from "./signup-policy";
import { signupRejection } from "./signup-validation";

/*
 * ด่านนี้เป็นที่เดียวที่กันการสมัครมั่วได้จริง — ฟอร์มกันได้แค่คนที่เดินผ่านหน้าเว็บ
 * ส่วน /api/auth/sign-up/email ยิงตรงด้วย curl ได้ เทสต์ชุดนี้จึงจำลอง "คนที่ไม่ผ่านฟอร์ม"
 * คือส่ง body อะไรมาก็ได้ รวมถึงไม่ส่งฟิลด์ที่ฟอร์มบังคับไว้เลย
 */

const CREATE = { action: "create-user" } as const;
const ORG_EMAIL = `somchai@${ORGANISATION_EMAIL_DOMAIN}`;

/** ผู้สมัครที่กรอกครบถูกต้องทุกอย่าง ใช้เป็นฐานแล้วค่อยทำให้พังทีละอย่าง */
const validCandidate = {
  email: ORG_EMAIL,
  affiliation: "กรมยุทธการทหาร",
};

describe("signupRejection", () => {
  it("ข้อมูลครบถูกต้อง ต้องปล่อยผ่าน", () => {
    expect(signupRejection(validCandidate, CREATE)).toBeUndefined();
  });

  /*
   * ★ เทสต์ตัวนี้สำคัญกว่าที่เห็น: มันคือหลักประกันว่าการเพิ่มกฎใหม่ในอนาคต
   *   จะไม่ไล่คนที่ใช้งานอยู่ออกจากระบบ บัญชีเก่าที่สมัครไว้ก่อนมีช่องสังกัด
   *   หรือก่อนมีกฎโดเมน ต้องล็อกอินได้เหมือนเดิมเสมอ
   */
  it("ตอน sign-in ต้องไม่ตรวจอะไรเลย แม้ข้อมูลไม่ผ่านกฎปัจจุบัน", () => {
    const legacyUser = { email: "someone@gmail.com", affiliation: null };
    expect(signupRejection(legacyUser, { action: "sign-in" })).toBeUndefined();
  });

  describe("กฎโดเมนอีเมล", () => {
    it("อีเมลนอกโดเมนหน่วยงาน ต้องถูกปฏิเสธ", () => {
      const rejection = signupRejection({ ...validCandidate, email: "someone@gmail.com" }, CREATE);
      expect(rejection?.error).toBe("email_domain_not_allowed");
    });

    it("ไม่ส่งอีเมลมาเลย ต้องถูกปฏิเสธ ไม่ใช่ปล่อยผ่าน", () => {
      const rejection = signupRejection({ affiliation: "กรมยุทธการทหาร" }, CREATE);
      expect(rejection?.error).toBe("email_domain_not_allowed");
    });
  });

  /*
   * ★ นี่คือรูที่เพิ่งปิด: ของเดิมตรวจสังกัด "เฉพาะเมื่อมีค่าส่งมาแล้ว"
   *   แปลว่าการไม่ส่งฟิลด์นี้มาเลยคือทางลัดที่ผ่านฉลุย ทั้งที่ฟอร์มบังคับ required ไว้
   *   ผลคือบัญชีที่สังกัดเป็น null ซึ่ง admin มองหน้าจอแล้วไม่รู้เลยว่าคนนี้เป็นใคร
   */
  describe("กฎสังกัด", () => {
    it("ไม่ส่งสังกัดมาเลย ต้องถูกปฏิเสธ", () => {
      const rejection = signupRejection({ email: ORG_EMAIL }, CREATE);
      expect(rejection?.error).toBe("invalid_affiliation");
    });

    it("ส่งสังกัดเป็น null ต้องถูกปฏิเสธ", () => {
      const rejection = signupRejection({ email: ORG_EMAIL, affiliation: null }, CREATE);
      expect(rejection?.error).toBe("invalid_affiliation");
    });

    it("ส่งสังกัดเป็นช่องว่างล้วน ต้องถูกปฏิเสธ", () => {
      const rejection = signupRejection({ email: ORG_EMAIL, affiliation: "   " }, CREATE);
      expect(rejection?.error).toBe("invalid_affiliation");
    });

    /* ส่ง type แปลกๆ มาได้ เพราะ body ของ request ไม่ได้ถูกใครตรวจก่อนถึงตรงนี้ */
    it("ส่งสังกัดมาเป็นชนิดอื่นที่ไม่ใช่ string ต้องถูกปฏิเสธ", () => {
      expect(signupRejection({ email: ORG_EMAIL, affiliation: 42 }, CREATE)?.error).toBe(
        "invalid_affiliation",
      );
      expect(signupRejection({ email: ORG_EMAIL, affiliation: true }, CREATE)?.error).toBe(
        "invalid_affiliation",
      );
    });

    it("สังกัดยาวเกินที่กำหนด ต้องถูกปฏิเสธ", () => {
      const tooLong = "ก".repeat(MAX_AFFILIATION_LENGTH + 1);
      const rejection = signupRejection({ email: ORG_EMAIL, affiliation: tooLong }, CREATE);
      expect(rejection?.error).toBe("invalid_affiliation");
    });
  });

  /*
   * ★ ขอบเขตของข้อยกเว้นที่ admin ได้รับ ต้องแคบเท่าที่ตั้งใจไว้เป๊ะๆ
   *   ยกเว้นให้แค่กฎโดเมน เพราะทั้งหมดที่ทางนี้มีไว้ทำคือ "พาคนนอกหน่วยเข้ามา"
   *   ไม่ได้แปลว่าข้อมูลที่กรอกจะถูกต้องโดยอัตโนมัติ
   */
  describe("ตอน admin สร้างบัญชีให้ (runAsAdminProvisioning)", () => {
    it("อีเมลนอกโดเมนผ่านได้ ถ้าข้อมูลอื่นครบ", async () => {
      await runAsAdminProvisioning(async () => {
        const rejection = signupRejection(
          { email: "partner@contractor.co.th", affiliation: "บริษัทคู่สัญญา" },
          CREATE,
        );
        expect(rejection).toBeUndefined();
      });
    });

    it("แต่ยังบังคับสังกัดอยู่ ข้อยกเว้นครอบแค่กฎโดเมนเท่านั้น", async () => {
      await runAsAdminProvisioning(async () => {
        const rejection = signupRejection({ email: "partner@contractor.co.th" }, CREATE);
        expect(rejection?.error).toBe("invalid_affiliation");
      });
    });

    it("ข้อยกเว้นต้องหมดอายุเมื่อออกจากขอบเขต ไม่ค้างไปถึง request ถัดไป", async () => {
      await runAsAdminProvisioning(async () => {
        expect(signupRejection({ email: "partner@contractor.co.th", affiliation: "x" }, CREATE))
          .toBeUndefined();
      });

      const afterScope = signupRejection(
        { email: "partner@contractor.co.th", affiliation: "x" },
        CREATE,
      );
      expect(afterScope?.error).toBe("email_domain_not_allowed");
    });
  });
});
