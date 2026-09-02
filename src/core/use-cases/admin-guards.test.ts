import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, InvalidRoomError, RoomNotFoundError } from "@/core/domain/errors";
import { MAX_ROOM_CAPACITY } from "@/core/domain/room-rules";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { AccountProvisioning } from "@/core/ports/account-provisioning.port";
import type { AppUser, UserRepository } from "@/core/ports/user-repository.port";
import { makeCreateRoom } from "./create-room.use-case";
import { makeUpdateRoom } from "./update-room.use-case";
import { makeDeleteRoom } from "./delete-room.use-case";
import { makeListUsers } from "./list-users.use-case";
import { makeSetUserRole } from "./set-user-role.use-case";
import { makeSetUserStatus } from "./set-user-status.use-case";
import { makeDeleteUser } from "./delete-user.use-case";
import { makeCreateUser } from "./create-user.use-case";
import { makeSummarizeRoomUsage } from "./summarize-room-usage.use-case";

/*
 * การ์ด "ต้องเป็น admin" ถูกเขียนซ้ำด้วยมือใน use-case ห้าไฟล์ บวกกฎห้ามแก้สิทธิ์ตัวเอง
 * เทสต์ชุดนี้มีไว้กันวันที่มีคน copy ไฟล์ที่หกไปโดยลืมการ์ดติดไปด้วย
 */

const approved = { status: "approved", affiliation: "กองบัญชาการ" } as const;
const admin: AuthenticatedUser = { id: "admin-1", name: "Admin", email: "a@x.com", role: "admin", ...approved };
const normalUser: AuthenticatedUser = { id: "user-1", name: "User", email: "u@x.com", role: "user", ...approved };

const room = {
  id: "room-1",
  name: "Ocean Room",
  location: null,
  capacity: 8,
  description: null,
  equipment: [],
  ownerName: null,
  createdAt: new Date(),
};

function roomRepo(): RoomRepository {
  return {
    findAll: vi.fn(async () => [room]),
    findById: vi.fn(async () => room),
    create: vi.fn(async (input) => ({ ...room, ...input })),
    update: vi.fn(async (_id, input) => ({ ...room, ...input })),
    delete: vi.fn(async () => {}),
  };
}

function userRepo(): UserRepository {
  const row = (id: string, over: Partial<AppUser> = {}): AppUser => ({
    id,
    name: "N",
    email: "e@x.com",
    role: "user",
    status: "pending",
    affiliation: null,
    createdAt: new Date("2026-09-01T00:00:00"),
    ...over,
  });

  return {
    findAll: vi.fn(async () => []),
    findById: vi.fn(async (id: string) => row(id)),
    updateAccess: vi.fn(async (id, changes) => row(id, changes)),
    delete: vi.fn(async () => {}),
  };
}

describe("การ์ดสิทธิ์ admin", () => {
  it("createRoom ปฏิเสธผู้ใช้ทั่วไป และไม่แตะ repository เลย", async () => {
    const rooms = roomRepo();
    await expect(
      makeCreateRoom({ rooms })({
        actingUser: normalUser,
        name: "ห้องใหม่",
        location: null,
        capacity: 4,
        description: null,
        equipment: [],
        ownerName: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(rooms.create).not.toHaveBeenCalled();
  });

  it("updateRoom ปฏิเสธผู้ใช้ทั่วไป", async () => {
    const rooms = roomRepo();
    await expect(
      makeUpdateRoom({ rooms })({ roomId: "room-1", actingUser: normalUser, changes: { capacity: 5 } }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(rooms.update).not.toHaveBeenCalled();
  });

  it("deleteRoom ปฏิเสธผู้ใช้ทั่วไป", async () => {
    const rooms = roomRepo();
    await expect(
      makeDeleteRoom({ rooms })({ roomId: "room-1", actingUser: normalUser }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(rooms.delete).not.toHaveBeenCalled();
  });

  it("listUsers ปฏิเสธผู้ใช้ทั่วไป", async () => {
    const users = userRepo();
    await expect(makeListUsers({ users })({ actingUser: normalUser })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(users.findAll).not.toHaveBeenCalled();
  });

  it("setUserRole ปฏิเสธผู้ใช้ทั่วไป", async () => {
    const users = userRepo();
    await expect(
      makeSetUserRole({ users })({ actingUser: normalUser, targetUserId: "x", role: "admin" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(users.updateAccess).not.toHaveBeenCalled();
  });

  it("admin ทำได้ตามปกติ", async () => {
    const rooms = roomRepo();
    const users = userRepo();

    await expect(
      makeCreateRoom({ rooms })({
        actingUser: admin,
        name: "ห้องใหม่",
        location: null,
        capacity: 4,
        description: null,
        equipment: [],
        ownerName: null,
      }),
    ).resolves.toMatchObject({ name: "ห้องใหม่" });

    await expect(
      makeSetUserRole({ users })({ actingUser: admin, targetUserId: "someone", role: "admin" }),
    ).resolves.toMatchObject({ role: "admin" });
  });
});

describe("กฎเฉพาะของ use-case", () => {
  it("ห้าม admin เปลี่ยนสิทธิ์ของตัวเอง (กันล็อกตัวเองออกจากระบบ)", async () => {
    const users = userRepo();
    await expect(
      makeSetUserRole({ users })({ actingUser: admin, targetUserId: admin.id, role: "user" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(users.updateAccess).not.toHaveBeenCalled();
  });

  it("ความจุต้องมากกว่า 0", async () => {
    const rooms = roomRepo();
    await expect(
      makeCreateRoom({ rooms })({
        actingUser: admin,
        name: "ห้อง",
        location: null,
        capacity: 0,
        description: null,
        equipment: [],
        ownerName: null,
      }),
    ).rejects.toBeInstanceOf(InvalidRoomError);
  });

  /* เพดานต้องบังคับจาก core ด้วย ไม่ใช่แค่ zod ฝั่ง action — use-case ถูกเรียกจากทางอื่นได้ */
  it("ความจุเกินเพดานต้องถูกปฏิเสธ ทั้งตอนสร้างและตอนแก้ไข", async () => {
    const rooms = roomRepo();
    await expect(
      makeCreateRoom({ rooms })({
        actingUser: admin,
        name: "ห้องใหญ่เกินจริง",
        location: null,
        capacity: MAX_ROOM_CAPACITY + 1,
        description: null,
        equipment: [],
        ownerName: null,
      }),
    ).rejects.toBeInstanceOf(InvalidRoomError);

    await expect(
      makeUpdateRoom({ rooms })({
        roomId: "room-1",
        actingUser: admin,
        changes: { capacity: MAX_ROOM_CAPACITY + 1 },
      }),
    ).rejects.toBeInstanceOf(InvalidRoomError);

    expect(rooms.create).not.toHaveBeenCalled();
    expect(rooms.update).not.toHaveBeenCalled();
  });

  it("ชื่อห้องที่มีแต่ช่องว่างถือว่าไม่ได้ระบุชื่อ", async () => {
    const rooms = roomRepo();
    await expect(
      makeCreateRoom({ rooms })({
        actingUser: admin,
        name: "   ",
        location: null,
        capacity: 4,
        description: null,
        equipment: [],
        ownerName: null,
      }),
    ).rejects.toBeInstanceOf(InvalidRoomError);
  });

  it("ลบห้องที่ไม่มีอยู่แล้วต้องได้ RoomNotFoundError", async () => {
    const rooms = roomRepo();
    rooms.findById = vi.fn(async () => undefined);

    await expect(
      makeDeleteRoom({ rooms })({ roomId: "ไม่มี", actingUser: admin }),
    ).rejects.toBeInstanceOf(RoomNotFoundError);
  });
});

/*
 * ★ "admin ที่ยังไม่ได้รับอนุมัติ" ต้องทำอะไรระดับ admin ไม่ได้เลย
 *
 *   กติกาของระบบคือ admin ⇒ approved เสมอ แต่กติกานั้นถูกรักษาด้วยมือในทุกที่ที่เขียน
 *   คอลัมน์ role/status — และเคยพลาดมาแล้วจริงที่ set-admin.ts ซึ่งตั้งแค่ role
 *   จนได้ admin ที่ requireApprovedUser เด้งออกจากทุกหน้า
 *
 *   ตอนนั้นการ์ดพวกนี้ดูแค่ role คนที่อยู่ในสภาพนั้นจึงเข้าหน้าจอไม่ได้เลยก็จริง
 *   แต่ยิง Server Action ตรงๆ ได้ทุกคำสั่ง เทสต์ชุดนี้ตรึงไว้ว่าต้องไม่กลับไปเป็นแบบนั้นอีก
 */
describe("admin ที่ยังไม่ได้รับอนุมัติ", () => {
  const pendingAdmin: AuthenticatedUser = {
    id: "admin-2",
    name: "Admin รออนุมัติ",
    email: "p@x.com",
    role: "admin",
    status: "pending",
    affiliation: "กองบัญชาการ",
  };

  const clock = { now: () => new Date("2026-09-03T10:00:00") };

  function bookingRepo(): BookingRepository {
    return {
      findById: vi.fn(async () => undefined),
      findByRoomInRange: vi.fn(async () => []),
      findInRange: vi.fn(async () => []),
      create: vi.fn(async () => {
        throw new Error("ไม่ควรถูกเรียก");
      }),
      delete: vi.fn(async () => {}),
    };
  }

  function provisioning(): AccountProvisioning {
    return { createAccount: vi.fn(async () => ({ id: "new-user" })) };
  }

  it("createRoom / updateRoom / deleteRoom ปฏิเสธ และไม่แตะ repository", async () => {
    const rooms = roomRepo();

    await expect(
      makeCreateRoom({ rooms })({
        actingUser: pendingAdmin,
        name: "ห้องใหม่",
        location: null,
        capacity: 4,
        description: null,
        equipment: [],
        ownerName: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      makeUpdateRoom({ rooms })({
        roomId: "room-1",
        actingUser: pendingAdmin,
        changes: { capacity: 5 },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      makeDeleteRoom({ rooms })({ roomId: "room-1", actingUser: pendingAdmin }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(rooms.create).not.toHaveBeenCalled();
    expect(rooms.update).not.toHaveBeenCalled();
    expect(rooms.delete).not.toHaveBeenCalled();
  });

  /* ★ อ่านรายชื่อผู้ใช้ทั้งระบบไม่ได้ด้วย ไม่ใช่กันแค่คำสั่งที่เขียนข้อมูล */
  it("listUsers ปฏิเสธ และไม่ยิง query ออกไปเลย", async () => {
    const users = userRepo();
    await expect(
      makeListUsers({ users })({ actingUser: pendingAdmin }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(users.findAll).not.toHaveBeenCalled();
  });

  /* ★ ข้อนี้สำคัญที่สุด: ถ้าปล่อยผ่าน คนที่ยังไม่ถูกอนุมัติจะอนุมัติตัวเองต่อไม่ได้ก็จริง
     (ห้ามแก้ของตัวเอง) แต่ตั้งพวกพ้องขึ้นเป็น admin แล้วให้คนนั้นอนุมัติกลับมาได้ */
  it("setUserRole / setUserStatus / deleteUser ปฏิเสธ และไม่เขียนอะไรลงฐานข้อมูล", async () => {
    const users = userRepo();

    await expect(
      makeSetUserRole({ users })({
        actingUser: pendingAdmin,
        targetUserId: "someone",
        role: "admin",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      makeSetUserStatus({ users })({
        actingUser: pendingAdmin,
        targetUserId: "someone",
        status: "approved",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      makeDeleteUser({ users })({ actingUser: pendingAdmin, targetUserId: "someone" }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(users.updateAccess).not.toHaveBeenCalled();
    expect(users.delete).not.toHaveBeenCalled();
    expect(users.findById).not.toHaveBeenCalled();
  });

  it("createUser ปฏิเสธ และไม่สร้างบัญชีจริง", async () => {
    const users = userRepo();
    const provision = provisioning();

    await expect(
      makeCreateUser({ provisioning: provision, users })({
        actingUser: pendingAdmin,
        name: "คนใหม่",
        email: "new@example.com",
        password: "temp-password",
        affiliation: "บริษัทคู่สัญญา",
        role: "user",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(provision.createAccount).not.toHaveBeenCalled();
  });

  it("summarizeRoomUsage ปฏิเสธ ไม่ให้ดูสถิติการใช้ห้องทั้งองค์กร", async () => {
    const bookings = bookingRepo();
    const rooms = roomRepo();

    await expect(
      makeSummarizeRoomUsage({ bookings, rooms, clock })({
        actingUser: pendingAdmin,
        from: new Date("2026-09-01T00:00:00"),
        to: new Date("2026-09-30T00:00:00"),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(bookings.findInRange).not.toHaveBeenCalled();
  });

  /* ผู้ใช้ทั่วไปที่ยังไม่อนุมัติก็ต้องถูกปฏิเสธเหมือนเดิม ไม่ได้เปลี่ยนพฤติกรรมเดิมไป */
  it("ผู้ใช้ทั่วไปที่รออนุมัติก็ยังถูกปฏิเสธเหมือนเดิม", async () => {
    const users = userRepo();
    await expect(
      makeListUsers({ users })({ actingUser: { ...normalUser, status: "pending" } }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
