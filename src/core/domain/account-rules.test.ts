import { describe, expect, it } from "vitest";
import {
  MAX_AFFILIATION_LENGTH,
  affiliationProblem,
  emailDomainProblem,
  isApproved,
} from "./account-rules";

/*
 * กฎการรับสมัครเป็นด่านเดียวที่กันคนนอกองค์กรออกจากระบบจองห้องประชุม
 * ถ้ากฎนี้พังจะไม่มี error ให้เห็น มีแต่คนแปลกหน้าโผล่มาในรายชื่อรออนุมัติ
 * (หรือแย่กว่านั้นคือไม่โผล่เลยเพราะผ่านเข้าไปได้เงียบๆ)
 */

const ALLOWED = ["rtarf.mi.th"];

describe("emailDomainProblem", () => {
  it("ผ่านเมื่อโดเมนตรงกับที่อนุญาต", () => {
    expect(emailDomainProblem("somchai@rtarf.mi.th", ALLOWED)).toBeNull();
  });

  it("ปฏิเสธอีเมลนอกโดเมน และบอกด้วยว่าต้องใช้โดเมนไหน", () => {
    const problem = emailDomainProblem("somchai@gmail.com", ALLOWED);
    expect(problem).not.toBeNull();
    /* ต้องบอกโดเมนที่ถูกต้อง ไม่ใช่แค่ "อีเมลไม่ถูกต้อง" ลอยๆ */
    expect(problem).toContain("@rtarf.mi.th");
  });

  /* คนกรอกด้วยตัวใหญ่หรือ copy-paste มาพร้อมช่องว่างเป็นเรื่องปกติมาก */
  it("ไม่สนตัวพิมพ์เล็กใหญ่และช่องว่างหัวท้าย", () => {
    expect(emailDomainProblem("  Somchai@RTARF.MI.TH  ", ALLOWED)).toBeNull();
  });

  /*
   * ★ ต้องเทียบทั้งโดเมน ไม่ใช่ endsWith
   *   ถ้าใช้ endsWith("rtarf.mi.th") โดเมนอย่าง evil-rtarf.mi.th จะผ่านเข้ามาได้
   */
  it("ปฏิเสธโดเมนที่แค่ลงท้ายคล้ายกัน", () => {
    expect(emailDomainProblem("attacker@evil-rtarf.mi.th", ALLOWED)).not.toBeNull();
    expect(emailDomainProblem("attacker@rtarf.mi.th.evil.com", ALLOWED)).not.toBeNull();
  });

  /* ★ subdomain ไม่ใช่โดเมนเดียวกัน ต้องระบุมาให้ครบถ้าจะอนุญาต */
  it("ปฏิเสธ subdomain ที่ไม่ได้อยู่ในรายการ", () => {
    expect(emailDomainProblem("someone@mail.rtarf.mi.th", ALLOWED)).not.toBeNull();
  });

  it("ปฏิเสธอีเมลที่รูปแบบไม่ถูกต้อง", () => {
    expect(emailDomainProblem("ไม่มีแอท", ALLOWED)).not.toBeNull();
    expect(emailDomainProblem("@rtarf.mi.th", ALLOWED)).not.toBeNull();
    expect(emailDomainProblem("somchai@", ALLOWED)).not.toBeNull();
    expect(emailDomainProblem("", ALLOWED)).not.toBeNull();
  });

  /*
   * ★ รายการว่างต้องแปลว่า "ไม่มีใครสมัครได้" ไม่ใช่ "ใครก็สมัครได้"
   *   ถ้าตั้งค่าพลาดจนรายการว่าง ระบบต้องปิดประตู ไม่ใช่เปิดรับทุกคนเงียบๆ
   */
  it("รายการโดเมนว่างต้องปฏิเสธทุกอีเมล", () => {
    expect(emailDomainProblem("somchai@rtarf.mi.th", [])).not.toBeNull();
  });

  it("รองรับหลายโดเมนพร้อมกัน (ใช้ตอน dev)", () => {
    const devDomains = ["rtarf.mi.th", "example.com", "example.local"];
    expect(emailDomainProblem("dev@example.com", devDomains)).toBeNull();
    expect(emailDomainProblem("dev+abc@example.local", devDomains)).toBeNull();
    expect(emailDomainProblem("someone@gmail.com", devDomains)).not.toBeNull();
  });
});

describe("affiliationProblem", () => {
  it("ผ่านเมื่อกรอกมาปกติ", () => {
    expect(affiliationProblem("กรมยุทธการทหาร")).toBeNull();
  });

  /* ช่องว่างล้วนผ่าน required ของเบราว์เซอร์ได้ ต้องดักที่นี่ */
  it("ช่องว่างล้วนถือว่าไม่ได้กรอก", () => {
    expect(affiliationProblem("   ")).not.toBeNull();
    expect(affiliationProblem("")).not.toBeNull();
  });

  it("ยาวเกินเพดานถูกปฏิเสธ แต่ยาวเท่าเพดานพอดีต้องผ่าน", () => {
    expect(affiliationProblem("ก".repeat(MAX_AFFILIATION_LENGTH))).toBeNull();
    expect(affiliationProblem("ก".repeat(MAX_AFFILIATION_LENGTH + 1))).not.toBeNull();
  });
});

describe("isApproved", () => {
  it("อนุมัติแล้วเท่านั้นที่ผ่าน", () => {
    expect(isApproved({ status: "approved" })).toBe(true);
    expect(isApproved({ status: "pending" })).toBe(false);
  });
});
