import type { RoomWithStatus } from "@/core/domain/entities/room";
import { overlaps } from "@/core/domain/services/booking-overlap";
import type { RoomRepository } from "@/core/ports/room-repository.port";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { Clock } from "@/core/ports/clock.port";

export interface ListRoomsWithStatusDeps {
  rooms: RoomRepository;
  bookings: BookingRepository;
  clock: Clock;
}

export function makeListRoomsWithStatus(deps: ListRoomsWithStatusDeps) {
  return async function listRoomsWithStatus(): Promise<RoomWithStatus[]> {
    const [rooms, now] = [await deps.rooms.findAll(), deps.clock.now()];
    const currentBookings = await deps.bookings.findInRange(now, now);

    return rooms.map((room) => ({
      ...room,
      isBusyNow: currentBookings.some(
        (booking) =>
          booking.roomId === room.id &&
          overlaps(booking, { startTime: now, endTime: now }),
      ),
    }));
  };
}
