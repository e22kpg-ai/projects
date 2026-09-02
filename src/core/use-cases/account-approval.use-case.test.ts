import { describe, expect, it, vi } from "vitest";
import { AccountPendingError, ForbiddenError, UserNotFoundError } from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { AppUser, UserRepository } from "@/core/ports/user-repository.port";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import { makeSetUserStatus } from "./set-user-status.use-case";
import { makeDeleteUser } from "./delete-user.use-case";
import { makeCreateBooking } from "./create-booking.use-case";
import { makeCancelBooking } from "./cancel-booking.use-case";

/*
 * ด่าน "ต้องได้รับอนุมัติก่อน" คือสิ่งเดียวที่กั้นระหว่างคนที่เพิ่งสมัครกับข้อมูลการประชุมจริง
 *
 * ★ หน้าเว็บ redirect ไป /pending ให้ก็จริง แต่นั่นกันได้แค่คนที่เดินผ่านหน้าเว็บ
 *   Server Action ยิงตรงได้โดยไม่ต้องเรนเดอร์หน้าเลย เทสต์ชุดนี้จึงยิงที่ use-case
 *   ซึ่งเป็นด่านจริง ไม่ใช่ทดสอบผ่าน UI
 */

const NOW = new Date("2026-09-02T09:00:00");

const admin: AuthenticatedUser = {
  id: "admin-1",
  name: "ผู้ดูแล",
  email: "admin@rtarf.mi.th",
  role: "admin",
  status: "approved",
  affiliation: "กองบัญชาการกองทัพไทย",
};

const approvedUser: AuthenticatedUser = {
  id: "user-1",
  name: "สมชาย",
  email: "somchai@rtarf.mi.th",
  role: "user",
  status: "approved",
  affiliation: "กรมยุทธการทหาร",
};

const pendingUser: AuthenticatedUser = { ...approvedUser, id: "user-2", status: "pending" };

/* admin ที่ยังไม่ถูกอนุมัติ — มีไว้ยืนยันว่า role ไม่ได้ลัดผ่านด่านอนุมัติ */
const pendingAdmin: AuthenticatedUser = { ...admin, id: "admin-2", status: "pending" };

function appUser(id: string, over: Partial<AppUser> = {}): AppUser {
  return {
    id,
    name: "ผู้ใช้",
    email: "u@rtarf.mi.th",
    role: "user",
    status: "pending",
    affiliation: "กรมยุทธการทหาร",
    createdAt: NOW,
    ...over,
  };
}

function userRepo(): UserRepository {
  return {
    findAll: vi.fn(async () => []),
    findById: vi.fn(async (id: string) => appUser(id)),
    updateRole: vi.fn(async (id, role) => appUser(id, { role })),
    updateStatus: vi.fn(async (id, status) => appUser(id, { status })),
    delete: vi.fn(async () => {}),
  };
}

describe("setUserStatus", () => {
  it("admin อนุมัติผู้ใช้ได้", async () => {
    const users = userRepo();
    await expect(
      makeSetUserStatus({ users })({ actingUser: admin, targetUserId: "user-9", status: "approved" }),
    ).resolves.toMatchObject({ status: "approved" });
    expect(users.updateStatus).toHaveBeenCalledWith("user-9", "approved");
  });

  it("admin เพิกถอนสิทธิ์กลับเป็นรออนุมัติได้", async () => {
    const users = userRepo();
    await expect(
      makeSetUserStatus({ users })({ actingUser: admin, targetUserId: "user-9", status: "pending" }),
    ).resolves.toMatchObject({ status: "pending" });
  });

  it("ผู้ใช้ทั่วไปอนุมัติใครไม่ได้ และไม่แตะ repository เลย", async () => {
    const users = userRepo();
    await expect(
      makeSetUserStatus({ users })({
        actingUser: approvedUser,
        targetUserId: "user-9",
        status: "approved",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(users.updateStatus).not.toHaveBeenCalled();
  });

  /* ★ กันเคสที่ admin คนสุดท้ายเผลอเพิกถอนตัวเองแล้วไม่มีใครเข้าหน้าอนุมัติได้อีก */
  it("admin เปลี่ยนสถานะของตัวเองไม่ได้", async () => {
    const users = userRepo();
    await expect(
      makeSetUserStatus({ users })({ actingUser: admin, targetUserId: admin.id, status: "pending" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(users.updateStatus).not.toHaveBeenCalled();
  });

  it("เปลี่ยนสถานะผู้ใช้ที่ไม่มีอยู่ ต้องได้ UserNotFoundError", async () => {
    const users = userRepo();
    users.updateStatus = vi.fn(async () => undefined);
    await expect(
      makeSetUserStatus({ users })({ actingUser: admin, targetUserId: "ไม่มี", status: "approved" }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

describe("deleteUser", () => {
  it("admin ลบบัญชีที่ปฏิเสธได้", async () => {
    const users = userRepo();
    await makeDeleteUser({ users })({ actingUser: admin, targetUserId: "user-9" });
    expect(users.delete).toHaveBeenCalledWith("user-9");
  });

  it("ผู้ใช้ทั่วไปลบบัญชีคนอื่นไม่ได้", async () => {
    const users = userRepo();
    await expect(
      makeDeleteUser({ users })({ actingUser: approvedUser, targetUserId: "user-9" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(users.delete).not.toHaveBeenCalled();
  });

  it("admin ลบตัวเองไม่ได้", async () => {
    const users = userRepo();
    await expect(
      makeDeleteUser({ users })({ actingUser: admin, targetUserId: admin.id }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(users.delete).not.toHaveBeenCalled();
  });

  /* ต้องรู้ว่ากดปฏิเสธคนที่ถูกจัดการไปแล้ว ไม่ใช่เห็นว่า "สำเร็จ" ทั้งที่ไม่เกิดอะไรขึ้น */
  it("ลบบัญชีที่ไม่มีอยู่ ต้องได้ UserNotFoundError ไม่ใช่เงียบผ่าน", async () => {
    const users = userRepo();
    users.findById = vi.fn(async () => undefined);
    await expect(
      makeDeleteUser({ users })({ actingUser: admin, targetUserId: "ไม่มี" }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
    expect(users.delete).not.toHaveBeenCalled();
  });
});

describe("ด่านอนุมัติในงานที่แตะข้อมูลจริง", () => {
  const room = {
    id: "room-1",
    name: "ห้องประชุมเจ้าพระยา",
    location: null,
    capacity: 8,
    description: null,
    equipment: [],
    ownerName: null,
    createdAt: NOW,
  };

  function bookingDeps() {
    const rooms: RoomRepository = {
      findAll: vi.fn(async () => [room]),
      findById: vi.fn(async () => room),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as RoomRepository;

    const bookings: BookingRepository = {
      findById: vi.fn(async () => ({
        id: "booking-1",
        roomId: "room-1",
        userId: pendingUser.id,
        title: "ประชุม",
        startTime: new Date("2026-09-02T13:00:00"),
        endTime: new Date("2026-09-02T14:00:00"),
        department: "กรมยุทธการทหาร",
        chairperson: "สมชาย",
        dressCode: "unspecified" as const,
        createdAt: NOW,
      })),
      findByRoomInRange: vi.fn(async () => []),
      findInRange: vi.fn(async () => []),
      create: vi.fn(),
      delete: vi.fn(),
    };

    return { rooms, bookings, clock: { now: () => NOW } };
  }

  function bookingInput(actingUser: AuthenticatedUser) {
    return {
      actingUser,
      roomId: "room-1",
      userId: actingUser.id,
      title: "ประชุมทดสอบ",
      startTime: new Date("2026-09-02T10:00:00"),
      endTime: new Date("2026-09-02T11:00:00"),
      department: "กรมยุทธการทหาร",
      chairperson: "สมชาย",
      dressCode: "unspecified" as const,
    };
  }

  it("บัญชีที่รออนุมัติจองห้องไม่ได้ และต้องไม่ได้ยิงถาม repository เลย", async () => {
    const deps = bookingDeps();
    await expect(
      makeCreateBooking(deps)(bookingInput(pendingUser)),
    ).rejects.toBeInstanceOf(AccountPendingError);

    /*
     * ★ สำคัญกว่าตัว error: ต้องไม่มีการอ่านห้องหรือการจองเลย
     *   ถ้าปล่อยให้ไปถึงด่านตรวจห้องชนก่อน error ที่ได้จะบอกใบ้ว่าช่วงเวลาไหนว่าง
     *   ซึ่งเป็นข้อมูลที่คนยังไม่ได้รับอนุมัติไม่ควรได้
     */
    expect(deps.rooms.findById).not.toHaveBeenCalled();
    expect(deps.bookings.findByRoomInRange).not.toHaveBeenCalled();
  });

  it("บัญชีที่รออนุมัติยกเลิกการจองไม่ได้ แม้จะเป็นการจองของตัวเอง", async () => {
    const deps = bookingDeps();
    await expect(
      makeCancelBooking(deps)({ bookingId: "booking-1", actingUser: pendingUser }),
    ).rejects.toBeInstanceOf(AccountPendingError);
    expect(deps.bookings.findById).not.toHaveBeenCalled();
    expect(deps.bookings.delete).not.toHaveBeenCalled();
  });

  /* ★ เป็น admin ไม่ได้แปลว่าข้ามด่านอนุมัติได้ */
  it("admin ที่ยังไม่ถูกอนุมัติก็จองไม่ได้เหมือนกัน", async () => {
    const deps = bookingDeps();
    await expect(
      makeCreateBooking(deps)(bookingInput(pendingAdmin)),
    ).rejects.toBeInstanceOf(AccountPendingError);
  });

  it("บัญชีที่อนุมัติแล้วจองได้ตามปกติ", async () => {
    const deps = bookingDeps();
    deps.bookings.create = vi.fn(async (b) => ({ ...b, id: "new", createdAt: NOW }));
    await expect(makeCreateBooking(deps)(bookingInput(approvedUser))).resolves.toMatchObject({
      id: "new",
    });
  });

  /* actingUser เป็นบริบทของการเรียก ไม่ใช่คอลัมน์ ต้องไม่รั่วลงไปถึง repository */
  it("actingUser ต้องไม่ถูกส่งต่อไปให้ repository ตอนบันทึก", async () => {
    const deps = bookingDeps();
    const created: unknown[] = [];
    deps.bookings.create = vi.fn(async (b) => {
      created.push(b);
      return { ...b, id: "new", createdAt: NOW };
    });

    await makeCreateBooking(deps)(bookingInput(approvedUser));
    expect(created[0]).not.toHaveProperty("actingUser");
  });
});
