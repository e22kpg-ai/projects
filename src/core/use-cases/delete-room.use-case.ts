import { isActiveAdmin } from "@/core/domain/account-rules";
import { ForbiddenError, RoomNotFoundError } from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";

export interface DeleteRoomDeps {
  rooms: RoomRepository;
}

export interface DeleteRoomInput {
  roomId: string;
  actingUser: AuthenticatedUser;
}

/**
 * Deleting a room cascades to its bookings at the DB level
 * (bookings.roomId has onDelete: "cascade") — callers must warn the user
 * before confirming this action.
 */
export function makeDeleteRoom(deps: DeleteRoomDeps) {
  return async function deleteRoom(input: DeleteRoomInput): Promise<void> {
    if (!isActiveAdmin(input.actingUser)) {
      throw new ForbiddenError();
    }

    const existing = await deps.rooms.findById(input.roomId);
    if (!existing) {
      throw new RoomNotFoundError(input.roomId);
    }

    await deps.rooms.delete(input.roomId);
  };
}
