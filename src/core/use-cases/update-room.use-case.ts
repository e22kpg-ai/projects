import type { Room, RoomUpdate } from "@/core/domain/entities/room";
import { ForbiddenError, InvalidRoomError, RoomNotFoundError } from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";

export interface UpdateRoomDeps {
  rooms: RoomRepository;
}

export interface UpdateRoomInput {
  roomId: string;
  actingUser: AuthenticatedUser;
  changes: RoomUpdate;
}

export function makeUpdateRoom(deps: UpdateRoomDeps) {
  return async function updateRoom(input: UpdateRoomInput): Promise<Room> {
    if (input.actingUser.role !== "admin") {
      throw new ForbiddenError();
    }
    if (input.changes.capacity !== undefined && input.changes.capacity <= 0) {
      throw new InvalidRoomError("ความจุต้องมากกว่า 0");
    }

    const updated = await deps.rooms.update(input.roomId, input.changes);
    if (!updated) {
      throw new RoomNotFoundError(input.roomId);
    }
    return updated;
  };
}
