import { config } from "dotenv";
config({ path: ".env.local" });

/*
 * ★ สคริปต์นี้สร้างบัญชีทดสอบที่ "รหัสผ่านเป็นที่รู้กัน" (ดู dev-user.ts)
 *   ถ้าเผลอรันใส่ฐานข้อมูลจริง = เปิดประตูให้ใครก็ได้เข้าระบบทันที
 *   จึงบังคับให้ชี้ไปที่ไฟล์ในเครื่อง (file:) เท่านั้น เว้นแต่จะยืนยันด้วย ALLOW_REMOTE_SEED=1
 */
function assertLocalDatabase() {
  const url = process.env.TURSO_DATABASE_URL ?? "";

  if (url.startsWith("file:")) return;
  if (process.env.ALLOW_REMOTE_SEED === "1") {
    console.warn(`⚠ Seeding a NON-LOCAL database: ${url}`);
    return;
  }

  console.error(
    `Refusing to seed a non-local database.\n` +
      `  TURSO_DATABASE_URL = ${url || "(unset)"}\n` +
      `  Seeding creates the dev account from dev-user.ts, whose password is public.\n` +
      `  Set ALLOW_REMOTE_SEED=1 only if you are certain this is what you want.`,
  );
  process.exit(1);
}

/*
 * ห้องตัวอย่างสำหรับ demo
 *
 * id คงที่ ไม่ใช่ crypto.randomUUID() — ไม่งั้น onConflictDoNothing() จะไม่มีอะไรให้ชน
 * (rooms ไม่มี unique constraint บน name) แล้วการรันซ้ำจะได้ห้องซ้ำเพิ่มมาทุกครั้ง
 *
 * ความจุตั้งใจกระจายให้ครบทุกช่วงของตัวกรองในหน้า /rooms (ไม่เกิน 20 / 21–40 / 41–100 /
 * มากกว่า 100) เพื่อให้ตัวกรองมีของให้เห็นผลจริงตอน demo ไม่ใช่ทุกห้องตกช่องเดียวกันหมด
 */
const SAMPLE_ROOMS = [
  {
    id: "seed-room-phaphirun",
    name: "ห้องประชุมพระพิรุณ",
    location: "ชั้น 3 อาคารอำนวยการ",
    capacity: 8,
    description: "ห้องประชุมขนาดเล็กสำหรับหารือภายในฝ่าย",
    equipment: ["จอ LED 55 นิ้ว", "กระดานไวท์บอร์ด"],
    ownerName: "ฝ่ายอำนวยการ",
  },
  {
    id: "seed-room-chaophraya",
    name: "ห้องประชุมเจ้าพระยา",
    location: "ชั้น 2 อาคารอำนวยการ",
    capacity: 20,
    description: "ห้องประชุมประจำฝ่าย รองรับการประชุมประจำสัปดาห์",
    equipment: ["โปรเจกเตอร์", "ระบบเสียง", "ไมโครโฟนไร้สาย 2 ตัว"],
    ownerName: "ฝ่ายอำนวยการ",
  },
  {
    id: "seed-room-suvarnabhumi",
    name: "ห้องประชุมสุวรรณภูมิ",
    location: "ชั้น 4 อาคารอำนวยการ",
    capacity: 35,
    description: "ห้องประชุมขนาดกลาง มีระบบประชุมทางไกล",
    equipment: ["ระบบประชุมทางไกล", "โปรเจกเตอร์", "ระบบเสียง"],
    ownerName: "ฝ่ายเทคโนโลยีสารสนเทศ",
  },
  {
    id: "seed-room-rattanakosin",
    name: "ห้องประชุมรัตนโกสินทร์",
    location: "ชั้น 5 อาคารอำนวยการ",
    capacity: 80,
    description: "ห้องประชุมใหญ่สำหรับการประชุมระดับหน่วยงาน",
    equipment: ["จอ LED ขนาดใหญ่", "ระบบเสียง", "ไมโครโฟนไร้สาย 6 ตัว", "ระบบบันทึกการประชุม"],
    ownerName: "ฝ่ายแผนงาน",
  },
  {
    id: "seed-room-grand-hall",
    name: "หอประชุมใหญ่",
    location: "ชั้น 1 อาคารเอนกประสงค์",
    capacity: 150,
    description: "หอประชุมสำหรับพิธีการและการอบรมขนาดใหญ่",
    equipment: ["เวที", "ระบบเสียงเต็มรูปแบบ", "จอฉายภาพขนาดใหญ่", "ระบบไฟเวที"],
    ownerName: "ฝ่ายอำนวยการ",
  },
];

/*
 * แม่แบบการจองตัวอย่าง
 *
 * ★ dayOffset นับจาก "วันนี้" ไม่ใช่วันที่ตายตัว — ถ้าฝังวันที่ไว้ ข้อมูลจะหมดอายุภายในไม่กี่สัปดาห์
 *   แล้วรายงานการใช้ห้องจะกลับไปว่างเปล่าอีกโดยไม่มีใครรู้ว่าทำไม
 *
 * ★ ค่าลบ = ย้อนหลัง เข้ารายงานการใช้ห้อง (นับเฉพาะที่จบไปแล้ว)
 *   ค่าบวก = ล่วงหน้า ขึ้นบนปฏิทิน (ของที่จบแล้วถูกซ่อนออกจากปฏิทินไปแล้ว)
 *
 * ★ seed เขียนลง DB ตรงๆ ไม่ผ่าน create-booking.use-case จึงไม่มีใครบังคับกฎให้
 *   ข้อมูลชุดนี้ต้องคุมเองสองอย่าง: อยู่ในเวลาทำการ 08:00–18:00 ของวันเดียวกัน
 *   และห้ามซ้อนกันเองในห้องเดียวกัน (DB มีแค่ CHECK end > start ไม่มี exclusion constraint)
 */
const SAMPLE_BOOKINGS = [
  // ── ย้อนหลัง: ป้อนให้รายงานการใช้ห้อง ──────────────────────────────
  { dayOffset: -19, roomId: "seed-room-chaophraya", start: [9, 0], end: [11, 0], title: "ประชุมติดตามผลการดำเนินงานประจำเดือน", department: "ฝ่ายแผนงาน", chairperson: "นายสมชาย ใจดี", dressCode: "long_sleeve_uniform" },
  { dayOffset: -19, roomId: "seed-room-phaphirun", start: [13, 30], end: [15, 0], title: "หารือแนวทางปรับปรุงระบบสารบรรณ", department: "ฝ่ายเทคโนโลยีสารสนเทศ", chairperson: "นางสาววิภา ตั้งมั่น", dressCode: "duty_uniform" },
  { dayOffset: -18, roomId: "seed-room-rattanakosin", start: [9, 30], end: [12, 0], title: "ประชุมคณะกรรมการบริหารความเสี่ยง", department: "ฝ่ายแผนงาน", chairperson: "นายสมชาย ใจดี", dressCode: "long_sleeve_uniform" },
  { dayOffset: -15, roomId: "seed-room-suvarnabhumi", start: [10, 0], end: [12, 0], title: "ประชุมทางไกลร่วมกับสำนักงานภูมิภาค", department: "ฝ่ายเทคโนโลยีสารสนเทศ", chairperson: "นางสาววิภา ตั้งมั่น", dressCode: "duty_uniform" },
  { dayOffset: -15, roomId: "seed-room-chaophraya", start: [14, 0], end: [16, 0], title: "ประชุมพิจารณาคำของบประมาณ", department: "ฝ่ายการเงิน", chairperson: "นางมาลี ทรัพย์มั่น", dressCode: "long_sleeve_uniform" },
  { dayOffset: -14, roomId: "seed-room-phaphirun", start: [9, 0], end: [10, 30], title: "หารือแผนอัตรากำลังประจำปี", department: "ฝ่ายบุคคล", chairperson: "นายประเสริฐ มานะ", dressCode: "duty_uniform" },
  { dayOffset: -12, roomId: "seed-room-grand-hall", start: [8, 30], end: [12, 0], title: "อบรมการใช้งานระบบจองห้องประชุม", department: "ฝ่ายเทคโนโลยีสารสนเทศ", chairperson: "นางสาววิภา ตั้งมั่น", dressCode: "duty_uniform" },
  { dayOffset: -12, roomId: "seed-room-chaophraya", start: [13, 0], end: [14, 30], title: "ประชุมคณะทำงานจัดทำคู่มือปฏิบัติงาน", department: "ฝ่ายอำนวยการ", chairperson: "นายสมชาย ใจดี", dressCode: "unspecified" },
  { dayOffset: -11, roomId: "seed-room-rattanakosin", start: [9, 0], end: [11, 30], title: "ประชุมชี้แจงนโยบายประจำปีงบประมาณ", department: "ฝ่ายแผนงาน", chairperson: "นายสมชาย ใจดี", dressCode: "long_sleeve_uniform" },
  { dayOffset: -8, roomId: "seed-room-phaphirun", start: [10, 0], end: [11, 0], title: "หารือการจัดสวัสดิการพนักงาน", department: "ฝ่ายบุคคล", chairperson: "นายประเสริฐ มานะ", dressCode: "duty_uniform" },
  { dayOffset: -8, roomId: "seed-room-suvarnabhumi", start: [13, 0], end: [15, 30], title: "ประชุมติดตามความคืบหน้าโครงการดิจิทัล", department: "ฝ่ายเทคโนโลยีสารสนเทศ", chairperson: "นางสาววิภา ตั้งมั่น", dressCode: "duty_uniform" },
  { dayOffset: -7, roomId: "seed-room-chaophraya", start: [9, 0], end: [10, 30], title: "ประชุมประจำสัปดาห์ฝ่ายการเงิน", department: "ฝ่ายการเงิน", chairperson: "นางมาลี ทรัพย์มั่น", dressCode: "duty_uniform" },
  { dayOffset: -5, roomId: "seed-room-rattanakosin", start: [13, 30], end: [16, 0], title: "ประชุมคณะกรรมการตรวจรับพัสดุ", department: "ฝ่ายการเงิน", chairperson: "นางมาลี ทรัพย์มั่น", dressCode: "long_sleeve_uniform" },
  { dayOffset: -4, roomId: "seed-room-phaphirun", start: [14, 0], end: [15, 0], title: "สัมภาษณ์ผู้สมัครตำแหน่งนักวิเคราะห์นโยบาย", department: "ฝ่ายบุคคล", chairperson: "นายประเสริฐ มานะ", dressCode: "long_sleeve_uniform" },
  { dayOffset: -2, roomId: "seed-room-chaophraya", start: [9, 30], end: [11, 30], title: "ประชุมเตรียมการตรวจราชการ", department: "ฝ่ายอำนวยการ", chairperson: "นายสมชาย ใจดี", dressCode: "long_sleeve_uniform" },
  { dayOffset: -1, roomId: "seed-room-suvarnabhumi", start: [10, 0], end: [11, 30], title: "ประชุมทางไกลติดตามงบลงทุน", department: "ฝ่ายการเงิน", chairperson: "นางมาลี ทรัพย์มั่น", dressCode: "duty_uniform" },

  // ── ล่วงหน้า: ป้อนให้ปฏิทิน ────────────────────────────────────────
  { dayOffset: 1, roomId: "seed-room-chaophraya", start: [9, 0], end: [11, 0], title: "ประชุมประจำเดือนฝ่ายอำนวยการ", department: "ฝ่ายอำนวยการ", chairperson: "นายสมชาย ใจดี", dressCode: "long_sleeve_uniform" },
  { dayOffset: 1, roomId: "seed-room-phaphirun", start: [13, 0], end: [14, 30], title: "หารือปรับปรุงแบบฟอร์มขออนุมัติ", department: "ฝ่ายบุคคล", chairperson: "นายประเสริฐ มานะ", dressCode: "duty_uniform" },
  { dayOffset: 2, roomId: "seed-room-rattanakosin", start: [9, 30], end: [12, 0], title: "ประชุมคณะกรรมการพิจารณาแผนงาน", department: "ฝ่ายแผนงาน", chairperson: "นายสมชาย ใจดี", dressCode: "long_sleeve_uniform" },
  { dayOffset: 2, roomId: "seed-room-suvarnabhumi", start: [14, 0], end: [16, 0], title: "ประชุมทางไกลกับหน่วยงานภายนอก", department: "ฝ่ายเทคโนโลยีสารสนเทศ", chairperson: "นางสาววิภา ตั้งมั่น", dressCode: "duty_uniform" },
  { dayOffset: 3, roomId: "seed-room-grand-hall", start: [8, 30], end: [11, 30], title: "อบรมเชิงปฏิบัติการด้านความปลอดภัยข้อมูล", department: "ฝ่ายเทคโนโลยีสารสนเทศ", chairperson: "นางสาววิภา ตั้งมั่น", dressCode: "duty_uniform" },
] as const;

/**
 * สร้าง Date ตามเวลาท้องถิ่นจากจำนวนวันนับจากวันนี้
 *
 * ใช้ตัวสร้างแบบระบุ y/m/d ทีละส่วน ไม่ใช่ toISOString() ตามกฎวันที่ของโปรเจกต์ —
 * toISOString() แปลงเป็น UTC ก่อน ที่ไทยจะได้วันคลาดไปหนึ่งวันแบบเงียบๆ
 */
function atLocalTime(dayOffset: number, [hour, minute]: readonly [number, number]): Date {
  const base = new Date();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, hour, minute, 0, 0);
}

// Dynamic imports so dotenv finishes loading .env.local before ./client reads
// process.env at module-evaluation time (static imports are hoisted and would
// run before the config() call above).
async function main() {
  assertLocalDatabase();

  const reset = process.argv.includes("--reset");

  const { db } = await import("./client");
  const { rooms, bookings } = await import("./schema/app-schema");
  const { user: userTable } = await import("./schema/auth-schema");
  const { DEV_USERS } = await import("../better-auth/dev-users-config");
  const { eq, notInArray } = await import("drizzle-orm");

  /*
   * ★ โหมดทำลายข้อมูล — ทำงานเมื่อส่ง --reset เท่านั้น และต้องผ่าน assertLocalDatabase() มาก่อน
   *
   *   มีไว้ล้างขยะที่สะสมจากการทดสอบก่อนเอาไป demo ข้อมูลที่ลบแล้วเอากลับมาไม่ได้
   *
   *   ไม่ลบบัญชีที่อยู่ใน DEV_USERS โดยตั้งใจ — รหัสผ่านของบัญชีเก็บอยู่ในตาราง account
   *   ซึ่งจะถูก cascade ทิ้งไปด้วย แล้วปุ่มล็อกอิน dev จะพังจนกว่าจะ seed ใหม่
   */
  if (reset) {
    const keepEmails = DEV_USERS.map((u) => u.email);

    const removedBookings = await db.delete(bookings).returning({ id: bookings.id });
    const removedRooms = await db.delete(rooms).returning({ id: rooms.id });
    const removedUsers = await db
      .delete(userTable)
      .where(notInArray(userTable.email, keepEmails))
      .returning({ email: userTable.email });

    console.log(
      `Reset: removed ${removedBookings.length} bookings, ${removedRooms.length} rooms, ` +
        `${removedUsers.length} users (kept ${keepEmails.join(", ")}).`,
    );
  }

  await db.insert(rooms).values(SAMPLE_ROOMS).onConflictDoNothing();
  console.log(`Seeded ${SAMPLE_ROOMS.length} rooms.`);

  const { auth } = await import("../better-auth/auth");

  for (const devUser of DEV_USERS) {
    try {
      await auth.api.signUpEmail({
        body: {
          email: devUser.email,
          password: devUser.password,
          name: devUser.name,
          affiliation: devUser.affiliation,
        },
      });
      console.log(`Seeded user: ${devUser.email} (role: ${devUser.role})`);
    } catch (err) {
      /* กลืนเฉพาะเคส "มีบัญชีนี้อยู่แล้ว" — error อื่นต้องดังให้ได้ยิน ไม่ใช่รายงานว่าสำเร็จ */
      const message = err instanceof Error ? err.message : String(err);
      if (/exist/i.test(message)) {
        console.log(`User already exists, skipping: ${devUser.email}`);
      } else {
        throw err;
      }
    }

    /*
     * ตั้ง role ตามค่าใน config และอนุมัติให้เลย
     *
     * ★ ต้องเซ็ต status ทุกครั้ง ไม่ใช่เฉพาะตอนสร้างใหม่ — บัญชีใหม่เกิดมาเป็น 'pending'
     *   เสมอตาม default ของตาราง ถ้าไม่อัปเดตตรงนี้ ปุ่มล็อกอิน dev จะพาไปหน้ารออนุมัติ
     *   ทั้งที่ยังไม่มี admin คนไหนในระบบจะมาอนุมัติให้ได้เลย
     */
    await db
      .update(userTable)
      .set({ role: devUser.role, status: "approved", affiliation: devUser.affiliation })
      .where(eq(userTable.email, devUser.email));
  }

  /*
   * การจองต้องผูกกับ user จริง จึงต้องอ่าน id กลับมาหลังสร้างบัญชีเสร็จ
   * ใช้บัญชีผู้ใช้ทั่วไปเป็นเจ้าของ เพื่อให้ตอน demo ล็อกอินด้วยบัญชีนั้นแล้วเห็นปุ่มยกเลิกได้
   */
  const [owner] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, DEV_USERS[0].email))
    .limit(1);

  if (!owner) {
    throw new Error(`Cannot seed bookings: user ${DEV_USERS[0].email} was not created.`);
  }

  const bookingRows = SAMPLE_BOOKINGS.map((sample, index) => ({
    id: `seed-booking-${index.toString().padStart(2, "0")}`,
    roomId: sample.roomId,
    userId: owner.id,
    title: sample.title,
    startTime: atLocalTime(sample.dayOffset, sample.start),
    endTime: atLocalTime(sample.dayOffset, sample.end),
    department: sample.department,
    chairperson: sample.chairperson,
    dressCode: sample.dressCode,
    createdAt: new Date(),
  }));

  await db.insert(bookings).values(bookingRows).onConflictDoNothing();

  const now = new Date();
  const past = bookingRows.filter((b) => b.endTime <= now).length;
  console.log(
    `Seeded ${bookingRows.length} bookings (${past} already finished → usage report, ` +
      `${bookingRows.length - past} upcoming → calendar).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
