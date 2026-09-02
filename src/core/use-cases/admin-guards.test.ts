import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, InvalidRoomError, RoomNotFoundError } from "@/core/domain/errors";
import { MAX_ROOM_CAPACITY } from "@/core/domain/room-rules";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { UserRepository } from "@/core/ports/user-repository.port";
import { makeCreateRoom } from "./create-room.use-case";
import { makeUpdateRoom } from "./update-room.use-case";
import { makeDeleteRoom } from "./delete-room.use-case";
import { makeListUsers } from "./list-users.use-case";
import { makeSetUserRole } from "./set-user-role.use-case";

/*
 * การ์ด "ต้องเป็น admin" ถูกเขียนซ้ำด้วยมือใน use-case ห้าไฟล์ บวกกฎห้ามแก้สิทธิ์ตัวเอง
 * เทสต์ชุดนี้มีไว้กันวันที่มีคน copy ไฟล์ที่หกไปโดยลืมการ์ดติดไปด้วย
 */

const admin: AuthenticatedUser = { id: "admin-1", name: "Admin", email: "a@x.com", role: "admin" };
const normalUser: AuthenticatedUser = { id: "user-1", name: "User", email: "u@x.com", role: "user" };

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
  return {
    findAll: vi.fn(async () => []),
    findById: vi.fn(async () => undefined),
    updateRole: vi.fn(async (id, role) => ({ id, name: "N", email: "e@x.com", role })),
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
    expect(users.updateRole).not.toHaveBeenCalled();
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
    expect(users.updateRole).not.toHaveBeenCalled();
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
