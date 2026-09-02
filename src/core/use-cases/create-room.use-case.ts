import type { NewRoom, Room } from "@/core/domain/entities/room";
import { ForbiddenError, InvalidRoomError } from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";

export interface CreateRoomDeps {
  rooms: RoomRepository;
}

export interface CreateRoomInput extends NewRoom {
  actingUser: AuthenticatedUser;
}

export function makeCreateRoom(deps: CreateRoomDeps) {
  return async function createRoom(input: CreateRoomInput): Promise<Room> {
    if (input.actingUser.role !== "admin") {
      throw new ForbiddenError();
    }
    if (input.capacity <= 0) {
      throw new InvalidRoomError("ความจุต้องมากกว่า 0");
    }

    /* zod ฝั่ง action เช็คแค่ min(1) ซึ่ง "   " ผ่าน — ห้องชื่อช่องว่างล้วนจะกลายเป็นแถวว่างเปล่าในทุกหน้า */
    const name = input.name.trim();
    if (!name) {
      throw new InvalidRoomError("กรุณาระบุชื่อห้อง");
    }

    return deps.rooms.create({
      name,
      location: input.location,
      capacity: input.capacity,
      description: input.description,
      equipment: input.equipment,
      ownerName: input.ownerName,
    });
  };
}
