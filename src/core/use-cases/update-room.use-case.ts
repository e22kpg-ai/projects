import { isActiveAdmin } from "@/core/domain/account-rules";
import type { Room, RoomUpdate } from "@/core/domain/entities/room";
import { capacityProblem } from "@/core/domain/room-rules";
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
    if (!isActiveAdmin(input.actingUser)) {
      throw new ForbiddenError();
    }
    if (input.changes.capacity !== undefined) {
      const capacityIssue = capacityProblem(input.changes.capacity);
      if (capacityIssue) {
        throw new InvalidRoomError(capacityIssue);
      }
    }

    const changes = { ...input.changes };
    if (changes.name !== undefined) {
      changes.name = changes.name.trim();
      if (!changes.name) {
        throw new InvalidRoomError("กรุณาระบุชื่อห้อง");
      }
    }

    const updated = await deps.rooms.update(input.roomId, changes);
    if (!updated) {
      throw new RoomNotFoundError(input.roomId);
    }
    return updated;
  };
}
