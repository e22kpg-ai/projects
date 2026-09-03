/*
 * ด่าน timezone ของ process — พยายามซ่อมก่อน ถ้าซ่อมไม่ได้ค่อยดัง
 *
 * ระบบนี้ตีความคำว่า "เวลาท้องถิ่น" เป็นเวลาท้องถิ่นของ process ที่รันอยู่
 * ถ้า production รันเป็น UTC (ค่าตั้งต้นของ host ส่วนใหญ่) ทุกอย่างที่อิง "ตอนนี้"
 * จะคลาดไป 7 ชั่วโมง — isBusyNow บอกว่าห้องว่างทั้งที่กำลังประชุมอยู่
 * และเส้นเวลาปัจจุบันในปฏิทินหายไปทั้งช่วงเช้า
 *
 * ★ จุดที่อันตรายคือมัน "หลอกตา": ป้ายเวลาบนหน้าจอจะยังดูถูกต้องทุกอย่าง
 *   เพราะตอนเก็บกับตอนอ่านใช้ offset ผิดตัวเดียวกัน เลยหักล้างกันพอดี
 *   คนจะไม่รู้ตัวจนกว่าจะมีคนเดินไปถึงห้องแล้วเจอว่ามีคนใช้อยู่
 *
 * ★ ทำไมเปลี่ยนจาก "ล้มทันที" มาเป็น "ตั้งค่าให้เอง":
 *   ของเดิมโยน error ทิ้งตอนสตาร์ทถ้า TZ ไม่ถูก ซึ่งกันความผิดพลาดได้จริง
 *   แต่แลกมาด้วยการที่ deploy ล้มทั้งรอบเพราะตัวแปรเดียวที่โค้ดตั้งเองได้
 *   Node รับค่า process.env.TZ ที่ตั้งตอน runtime ได้ทั้ง Date และ Intl
 *   จึงซ่อมให้ตรงนี้เลยดีกว่า แล้วค่อยบอกให้ไปตั้งที่ host ให้ถูก
 *
 * ★ แต่ต้องไม่กลายเป็น "ผิดเงียบๆ" ซึ่งเป็นสิ่งที่ไฟล์นี้มีไว้กันตั้งแต่แรก
 *   จึงยังดังอยู่สองระดับ: ซ่อมได้ก็ log ให้เห็นว่าไปตั้งที่ host ด้วย
 *   ซ่อมไม่ได้ก็ล้มแบบเดิม เพราะถึงตอนนั้นไม่เหลือทางอื่นให้เลือกแล้ว
 *
 * หมายเหตุ: ที่นี่ใช้ Intl.DateTimeFormat ได้ ไม่ขัดกับกฎใน CLAUDE.md
 * เพราะกฎนั้นห้ามใช้กับ "ข้อความที่ถูก SSR" เพื่อกัน hydration mismatch
 * ส่วนตรงนี้เป็นการตรวจตอนสตาร์ทฝั่ง server ล้วน ไม่มีอะไรถูกเรนเดอร์ออกไป
 */

export const APP_TIMEZONE = "Asia/Bangkok";

/**
 * คืนข้อความปัญหา หรือ `null` ถ้าไม่มีปัญหา
 *
 * แยกเป็นฟังก์ชันบริสุทธิ์เพื่อให้เขียนเทสต์ได้โดยไม่ต้องไปยุ่งกับ process จริง
 */
export function timezoneProblem(resolved: string | undefined): string | null {
  if (!resolved) {
    return "อ่าน timezone ของ process ไม่ได้";
  }
  if (resolved !== APP_TIMEZONE) {
    return `process กำลังรันด้วย timezone "${resolved}" ไม่ใช่ "${APP_TIMEZONE}"`;
  }
  return null;
}

function resolveTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/** ผลของการพยายามจัดการ timezone — แยกออกมาเพื่อให้เทสต์ตรวจการตัดสินใจได้ */
export type TimezoneOutcome =
  /** ตั้งมาถูกอยู่แล้วจาก environment ไม่ต้องทำอะไร */
  | { kind: "already-correct" }
  /** ตั้งมาผิดหรือไม่ได้ตั้ง แต่โค้ดแก้ให้แล้วและยืนยันว่าติดจริง */
  | { kind: "corrected"; from: string | undefined }
  /** แก้แล้วยังไม่ติด — ไม่เหลือทางอื่น ต้องดัง */
  | { kind: "unfixable"; problem: string };

/**
 * ปรับ timezone ของ runtime ให้ตรงกับที่ระบบต้องการ แล้วรายงานว่าเกิดอะไรขึ้น
 *
 * ★ รับ resolver กับ setter เข้ามา ไม่ได้แตะ process เอง เพื่อให้เทสต์จำลอง
 *   ทั้งเคสที่ซ่อมติดและเคสที่ซ่อมไม่ติดได้ โดยไม่ต้องไปเปลี่ยน timezone ของเครื่องจริง
 *   (ย้ำว่าฟังก์ชันนี้ "ลงมือ" จริงผ่าน apply ที่ส่งเข้ามา ไม่ใช่แค่คำนวณแผนแล้วคืนค่า)
 *
 * ★ ต้อง "อ่านซ้ำหลังตั้ง" เสมอ ไม่ใช่ตั้งแล้วถือว่าสำเร็จ
 *   ถ้า runtime ไหนไม่รับค่าที่ตั้งตอน runtime (หรือ ICU ถูก build มาแบบจำกัด)
 *   การเชื่อว่าสำเร็จจะพาเรากลับไปสู่ "ผิดเงียบๆ" ซึ่งแย่กว่าตอนยังไม่มีด่านนี้เสียอีก
 */
export function reconcileTimezone(
  resolve: () => string | undefined,
  apply: (tz: string) => void,
): TimezoneOutcome {
  const before = resolve();
  if (timezoneProblem(before) === null) {
    return { kind: "already-correct" };
  }

  apply(APP_TIMEZONE);

  const after = resolve();
  const problem = timezoneProblem(after);
  if (problem === null) {
    return { kind: "corrected", from: before };
  }
  return { kind: "unfixable", problem };
}

/**
 * ทุกอย่างที่ `ensureAppTimezone` ต้องใช้จากโลกภายนอก
 *
 * ★ รวมไว้เป็นก้อนเดียวเพื่อให้เทสต์ครอบ "ด่านที่ต้องดัง" ได้จริง
 *   ถ้าปล่อยให้อ่าน process.env.NODE_ENV เองข้างใน จะไม่มีทางเขียนเทสต์ยืนยันว่า
 *   production ยังล้มอยู่ ซึ่งเป็น branch เดียวที่กัน "ผิดเงียบๆ" ในขั้นสุดท้าย
 */
export interface TimezoneEnvironment {
  resolve: () => string | undefined;
  apply: (tz: string) => void;
  isProduction: boolean;
  warn: (message: string) => void;
}

/** ต้องเป็นฟังก์ชัน ไม่ใช่ค่าคงที่ เพราะ NODE_ENV ต้องถูกอ่าน ณ ตอนเรียก ไม่ใช่ตอน import */
function processEnvironment(): TimezoneEnvironment {
  return {
    resolve: resolveTimezone,
    apply: (tz) => {
      process.env.TZ = tz;
    },
    isProduction: process.env.NODE_ENV === "production",
    warn: (message) => console.warn(message),
  };
}

/**
 * เรียกตอน server เริ่มทำงาน และตอนหัวสคริปต์ที่คำนวณวันเวลาเอง (เช่น seed)
 *
 * ซ่อมได้ → เตือนให้ไปตั้งที่ host ด้วย เพราะค่าที่ตั้งเองมีผลเฉพาะ process นี้เท่านั้น
 *
 * ซ่อมไม่ได้ → production ล้ม เพราะความผิดพลาดแบบนี้ไม่มีอาการให้เห็นระหว่างใช้งาน
 * ส่วน dev แค่เตือน จะได้ไม่ขวางคนที่เครื่องตั้ง timezone อื่นไว้
 */
export function ensureAppTimezone(
  env: TimezoneEnvironment = processEnvironment(),
): TimezoneOutcome {
  const outcome = reconcileTimezone(env.resolve, env.apply);

  if (outcome.kind === "already-correct") return outcome;

  if (outcome.kind === "corrected") {
    env.warn(
      `[timezone] process เริ่มมาด้วย "${outcome.from ?? "ไม่ทราบ"}" — ตั้งเป็น ${APP_TIMEZONE} ให้แล้ว\n` +
        `  ควรตั้ง TZ=${APP_TIMEZONE} ใน environment variables ของ host ด้วย\n` +
        `  เพราะค่าที่ตั้งตรงนี้มีผลเฉพาะ process ที่เรียกฟังก์ชันนี้เท่านั้น`,
    );
    return outcome;
  }

  const detail =
    `${outcome.problem}\n` +
    `  ตั้งค่าให้อัตโนมัติแล้วแต่ไม่เป็นผล runtime นี้อาจไม่รับ TZ ที่ตั้งตอนทำงาน\n` +
    `  ต้องตั้ง TZ=${APP_TIMEZONE} ใน environment variables ของ host เท่านั้น\n` +
    `  ถ้าปล่อยไว้ เวลาทั้งระบบจะคลาดไปตาม offset โดยที่หน้าจอยังดูปกติทุกอย่าง`;

  if (env.isProduction) {
    throw new Error(`[timezone] ${detail}`);
  }
  env.warn(`[timezone] ${detail}`);
  return outcome;
}
