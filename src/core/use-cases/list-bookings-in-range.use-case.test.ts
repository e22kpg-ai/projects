import { describe, expect, it, vi } from "vitest";
import type { Booking } from "@/core/domain/entities/booking";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import { makeListBookingsInRange } from "./list-bookings-in-range.use-case";
import { makeSummarizeRoomUsage } from "./summarize-room-usage.use-case";

/*
 * ★ เทสต์ชุดนี้คุม "เส้นแบ่ง" ระหว่างปฏิทินกับรายงานการใช้ห้อง
 *
 *   ปฏิทินโชว์การประชุมที่ยังไม่จบ ส่วนรายงานนับเฉพาะที่จบไปแล้ว
 *   ทั้งสองไฟล์เขียนคอมเมนต์ตรงกันว่า "เกณฑ์ต้องเป็นอันเดียวกัน" แต่ก่อนหน้านี้
 *   ไม่มีอะไรบังคับให้เป็นจริงเลย
 *
 *   ถ้ามีคนแก้ข้างหนึ่งจาก > เป็น >= การประชุมที่จบพอดีวินาทีนั้นจะโผล่ทั้งสองที่
 *   (นับซ้ำ) หรือหายจากทั้งสองที่ (ข้อมูลสูญ) โดยไม่มี error ให้เห็นเลย
 *   คนจะรู้ตัวก็ต่อเมื่อมีคนทักว่าตัวเลขในรายงานไม่ตรงกับที่จำได้
 */

const NOW = new Date("2026-09-02T13:00:00");

function booking(id: string, start: string, end: string): Booking {
  return {
    id,
    roomId: "room-1",
    userId: "user-1",
    title: `ประชุม ${id}`,
    startTime: new Date(start),
    endTime: new Date(end),
    department: "กรมยุทธการทหาร",
    chairperson: "สมชาย",
    dressCode: "unspecified",
    createdAt: new Date("2026-09-01T00:00:00"),
  };
}

/* ครอบทุกความสัมพันธ์กับ "ตอนนี้": จบไปแล้ว, จบพอดี, กำลังประชุม, ยังไม่เริ่ม */
const ENDED = booking("ended", "2026-09-02T09:00:00", "2026-09-02T10:00:00");
const ENDS_EXACTLY_NOW = booking("exact", "2026-09-02T12:00:00", "2026-09-02T13:00:00");
const IN_PROGRESS = booking("running", "2026-09-02T12:30:00", "2026-09-02T14:00:00");
const UPCOMING = booking("upcoming", "2026-09-02T15:00:00", "2026-09-02T16:00:00");

const ALL = [ENDED, ENDS_EXACTLY_NOW, IN_PROGRESS, UPCOMING];

function bookingRepo(rows: Booking[]): BookingRepository {
  return {
    findById: vi.fn(async () => undefined),
    findByRoomInRange: vi.fn(async () => rows),
    findInRange: vi.fn(async () => rows),
    create: vi.fn(),
    delete: vi.fn(async () => {}),
  };
}

const clock = { now: () => NOW };

describe("listBookingsInRange", () => {
  it("ไม่ใส่ excludeEnded คืนทุกอย่างที่ repository ให้มา", async () => {
    const bookings = bookingRepo(ALL);
    const result = await makeListBookingsInRange({ bookings, clock })({
      start: new Date("2026-09-02T00:00:00"),
      end: new Date("2026-09-03T00:00:00"),
    });
    expect(result).toHaveLength(ALL.length);
  });

  it("ส่ง roomId ต่อให้ repository ตามที่รับมา", async () => {
    const bookings = bookingRepo(ALL);
    const start = new Date("2026-09-02T00:00:00");
    const end = new Date("2026-09-03T00:00:00");
    await makeListBookingsInRange({ bookings, clock })({ start, end, roomId: "room-9" });
    expect(bookings.findInRange).toHaveBeenCalledWith(start, end, "room-9");
  });

  it("excludeEnded ตัดเฉพาะที่จบแล้ว การประชุมที่กำลังดำเนินอยู่ต้องยังอยู่", async () => {
    const bookings = bookingRepo(ALL);
    const result = await makeListBookingsInRange({ bookings, clock })({
      start: new Date("2026-09-02T00:00:00"),
      end: new Date("2026-09-03T00:00:00"),
      excludeEnded: true,
    });

    const ids = result.map((b) => b.id);
    expect(ids).toContain("running");
    expect(ids).toContain("upcoming");
    expect(ids).not.toContain("ended");
  });

  /*
   * ★ ขอบเป๊ะ: การประชุมที่จบ "พอดีวินาทีนี้" ถือว่าจบแล้ว จึงต้องหายจากปฏิทิน
   *   ถ้าเผลอเขียน >= แทน > มันจะค้างอยู่บนปฏิทินทั้งที่เลิกไปแล้ว
   *   และจะถูกนับซ้ำในรายงานด้วย (ดูเทสต์ชุดล่าง)
   */
  it("การประชุมที่จบพอดีเวลาปัจจุบัน ถือว่าจบแล้ว", async () => {
    const bookings = bookingRepo(ALL);
    const result = await makeListBookingsInRange({ bookings, clock })({
      start: new Date("2026-09-02T00:00:00"),
      end: new Date("2026-09-03T00:00:00"),
      excludeEnded: true,
    });
    expect(result.map((b) => b.id)).not.toContain("exact");
  });
});

describe("เส้นแบ่งระหว่างปฏิทินกับรายงาน", () => {
  async function split() {
    const bookings = bookingRepo(ALL);
    const rooms: RoomRepository = {
      findAll: vi.fn(async () => [
        {
          id: "room-1",
          name: "ห้องประชุมเจ้าพระยา",
          location: null,
          capacity: 8,
          description: null,
          equipment: [],
          ownerName: null,
          createdAt: NOW,
        },
      ]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as RoomRepository;

    const admin: AuthenticatedUser = {
      id: "admin-1",
      name: "ผู้ดูแล",
      email: "admin@rtarf.mi.th",
      role: "admin",
      status: "approved",
      affiliation: "กองบัญชาการกองทัพไทย",
    };

    const onCalendar = await makeListBookingsInRange({ bookings, clock })({
      start: new Date("2026-09-02T00:00:00"),
      end: new Date("2026-09-03T00:00:00"),
      excludeEnded: true,
    });

    const report = await makeSummarizeRoomUsage({ bookings, rooms, clock })({
      actingUser: admin,
      from: new Date("2026-09-02T00:00:00"),
      to: new Date("2026-09-03T00:00:00"),
    });

    return {
      calendarIds: onCalendar.map((b) => b.id).sort(),
      reportIds: report.entries.map((b) => b.id).sort(),
    };
  }

  it("ไม่มีการประชุมไหนโผล่ทั้งสองที่ (ไม่นับซ้ำ)", async () => {
    const { calendarIds, reportIds } = await split();
    const both = calendarIds.filter((id) => reportIds.includes(id));
    expect(both).toEqual([]);
  });

  it("ไม่มีการประชุมไหนหายไปจากทั้งสองที่ (ข้อมูลไม่สูญ)", async () => {
    const { calendarIds, reportIds } = await split();
    expect([...calendarIds, ...reportIds].sort()).toEqual(ALL.map((b) => b.id).sort());
  });

  it("แบ่งถูกฝั่ง: ที่จบแล้วไปรายงาน ที่ยังไม่จบอยู่ปฏิทิน", async () => {
    const { calendarIds, reportIds } = await split();
    expect(reportIds).toEqual(["ended", "exact"]);
    expect(calendarIds).toEqual(["running", "upcoming"]);
  });
});
