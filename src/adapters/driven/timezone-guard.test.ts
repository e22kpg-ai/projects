import { describe, expect, it, vi } from "vitest";
import {
  APP_TIMEZONE,
  ensureAppTimezone,
  reconcileTimezone,
  timezoneProblem,
  type TimezoneEnvironment,
} from "./timezone-guard";

/*
 * ด่านนี้มีไว้กันความผิดพลาดที่ "ไม่มีอาการ" — ถ้ามันเองพังเงียบๆ ก็ไม่เหลืออะไรกันแล้ว
 */
describe("timezoneProblem", () => {
  it("ตรงกับ timezone ของระบบ ถือว่าไม่มีปัญหา", () => {
    expect(timezoneProblem(APP_TIMEZONE)).toBeNull();
  });

  it("เป็น UTC ต้องรายงานปัญหา พร้อมบอกว่าเจอค่าอะไร", () => {
    const problem = timezoneProblem("UTC");
    expect(problem).not.toBeNull();
    expect(problem).toContain("UTC");
    expect(problem).toContain(APP_TIMEZONE);
  });

  it("เป็น timezone อื่นที่ offset เท่ากัน ก็ยังถือว่าผิด", () => {
    expect(timezoneProblem("Asia/Jakarta")).not.toBeNull();
  });

  it("อ่านค่าไม่ได้ ต้องถือว่าเป็นปัญหา ไม่ใช่ปล่อยผ่าน", () => {
    expect(timezoneProblem(undefined)).not.toBeNull();
    expect(timezoneProblem("")).not.toBeNull();
  });
});

/*
 * reconcileTimezone ลงมือแก้จริงผ่าน apply ที่ส่งเข้ามา แต่ไม่แตะ process เอง
 * จึงจำลองได้ทุกเคสโดยไม่ต้องไปเปลี่ยน timezone ของเครื่องที่รันเทสต์
 *
 * ★ เคสที่สำคัญที่สุดคือ "ตั้งแล้วไม่ติด" — ถ้าโค้ดเชื่อว่าตั้งแล้วต้องสำเร็จ
 *   ระบบจะกลับไปสู่สภาพผิดเงียบๆ ซึ่งแย่กว่าตอนยังไม่มีด่านนี้เสียอีก
 *   เพราะจะมี log บอกว่า "ซ่อมแล้ว" ทั้งที่ยังผิดอยู่
 */
describe("reconcileTimezone", () => {
  /** จำลอง process ที่รับค่า TZ ที่ตั้งตอน runtime ได้ (พฤติกรรมของ Node ปกติ) */
  function workingRuntime(initial: string | undefined) {
    let current = initial;
    return {
      resolve: () => current,
      apply: vi.fn((tz: string) => {
        current = tz;
      }),
    };
  }

  it("ตั้งมาถูกอยู่แล้ว ต้องไม่ไปแตะอะไรเลย", () => {
    const rt = workingRuntime(APP_TIMEZONE);
    expect(reconcileTimezone(rt.resolve, rt.apply)).toEqual({ kind: "already-correct" });
    expect(rt.apply).not.toHaveBeenCalled();
  });

  /* ★ ต้องจำค่าเดิมไว้ใน from ด้วย ไม่งั้นคนอ่าน log จะไม่รู้ว่า host ตั้งอะไรไว้ผิด */
  it("รันมาเป็น UTC ต้องถูกตั้งให้ถูกและรายงานว่าซ่อมแล้ว พร้อมค่าเดิม", () => {
    const rt = workingRuntime("UTC");
    expect(reconcileTimezone(rt.resolve, rt.apply)).toEqual({ kind: "corrected", from: "UTC" });
    expect(rt.apply).toHaveBeenCalledWith(APP_TIMEZONE);
  });

  it("อ่าน timezone ไม่ได้เลย ก็ยังต้องพยายามตั้งให้", () => {
    const rt = workingRuntime(undefined);
    expect(reconcileTimezone(rt.resolve, rt.apply)).toEqual({ kind: "corrected", from: undefined });
  });

  /*
   * ★ หัวใจของการออกแบบนี้: ตั้งแล้วต้องอ่านซ้ำเพื่อยืนยัน
   *   runtime ที่ไม่รับค่าตอน runtime (หรือ ICU ที่ถูก build มาแบบจำกัด) มีอยู่จริง
   *   ถ้าเจอแบบนั้นต้องตอบว่า unfixable เพื่อให้ชั้นบนล้มที่ production
   *   ไม่ใช่รายงานว่าซ่อมสำเร็จทั้งที่เวลายังผิดอยู่ 7 ชั่วโมง
   */
  it("ตั้งแล้วไม่ติด ต้องตอบว่าซ่อมไม่ได้ ไม่ใช่บอกว่าสำเร็จ", () => {
    const stubborn = {
      resolve: () => "UTC",
      apply: vi.fn(),
    };

    const outcome = reconcileTimezone(stubborn.resolve, stubborn.apply);

    expect(stubborn.apply).toHaveBeenCalledWith(APP_TIMEZONE);
    expect(outcome.kind).toBe("unfixable");
    if (outcome.kind === "unfixable") {
      expect(outcome.problem).toContain("UTC");
    }
  });

  it("ตั้งแล้วได้ timezone อื่นที่ยังผิดอยู่ ก็ถือว่าซ่อมไม่ได้", () => {
    const drifting = {
      resolve: vi.fn<() => string | undefined>(),
      apply: vi.fn(),
    };
    drifting.resolve.mockReturnValueOnce("UTC").mockReturnValueOnce("Asia/Tokyo");

    const outcome = reconcileTimezone(drifting.resolve, drifting.apply);
    expect(outcome.kind).toBe("unfixable");
  });
});

/*
 * ★ ชุดนี้คุ้ม branch ที่ทำหน้าที่ "ดัง" โดยเฉพาะ
 *   ถ้าวันหนึ่งมีคนลบ throw ทิ้งหรือแก้เงื่อนไข production ผิด ต้องมีเทสต์แดงให้เห็น
 *   ไม่งั้นด่านสุดท้ายที่กันเวลาคลาด 7 ชั่วโมงจะหายไปโดยไม่มีใครรู้
 */
describe("ensureAppTimezone", () => {
  function environment(overrides: Partial<TimezoneEnvironment> = {}): TimezoneEnvironment {
    return {
      resolve: () => APP_TIMEZONE,
      apply: vi.fn(),
      isProduction: false,
      warn: vi.fn(),
      ...overrides,
    };
  }

  /** runtime ที่ตั้ง TZ แล้วไม่เป็นผล — เคสเดียวที่ทำให้ต้องล้ม */
  const stuckOnUtc = { resolve: () => "UTC", apply: vi.fn() };

  it("ตั้งมาถูกอยู่แล้ว ต้องเงียบสนิท ไม่เตือนให้คนชิน warning", () => {
    const env = environment();
    expect(ensureAppTimezone(env)).toEqual({ kind: "already-correct" });
    expect(env.warn).not.toHaveBeenCalled();
  });

  it("ซ่อมได้ ต้อง log ให้เห็นหนึ่งครั้ง พร้อมบอกค่าเดิมที่เจอ", () => {
    let current: string | undefined = "UTC";
    const env = environment({
      resolve: () => current,
      apply: (tz) => {
        current = tz;
      },
    });

    expect(ensureAppTimezone(env)).toEqual({ kind: "corrected", from: "UTC" });
    expect(env.warn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(env.warn).mock.calls[0][0]).toContain("UTC");
  });

  it("ซ่อมได้ ต้องไม่ล้มแม้อยู่บน production เพราะเวลาถูกต้องแล้วจริง", () => {
    let current: string | undefined = "UTC";
    const env = environment({
      resolve: () => current,
      apply: (tz) => {
        current = tz;
      },
      isProduction: true,
    });

    expect(() => ensureAppTimezone(env)).not.toThrow();
  });

  it("ซ่อมไม่ได้บน production ต้องโยน error ไม่ใช่แค่เตือน", () => {
    const env = environment({ ...stuckOnUtc, isProduction: true });

    expect(() => ensureAppTimezone(env)).toThrow(/timezone/);
    expect(() => ensureAppTimezone(env)).toThrow(new RegExp(APP_TIMEZONE));
    expect(env.warn).not.toHaveBeenCalled();
  });

  /* dev ไม่ล้ม เพราะคนที่เครื่องตั้ง timezone อื่นไว้ก็ยังต้องทำงานต่อได้ */
  it("ซ่อมไม่ได้บน dev ต้องแค่เตือน แล้วปล่อยให้ทำงานต่อ", () => {
    const env = environment({ ...stuckOnUtc, isProduction: false });

    const outcome = ensureAppTimezone(env);

    expect(outcome.kind).toBe("unfixable");
    expect(env.warn).toHaveBeenCalledTimes(1);
  });
});
