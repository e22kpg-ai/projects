import type { Booking, NewBooking } from "@/core/domain/entities/booking";
import { findConflict } from "@/core/domain/services/booking-overlap";
import {
  BookingConflictError,
  InvalidBookingRangeError,
  RoomNotFoundError,
} from "@/core/domain/errors";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { RoomRepository } from "@/core/ports/room-repository.port";

export interface CreateBookingDeps {
  bookings: BookingRepository;
  rooms: RoomRepository;
}

export function makeCreateBooking(deps: CreateBookingDeps) {
  return async function createBooking(input: NewBooking): Promise<Booking> {
    if (input.endTime <= input.startTime) {
      throw new InvalidBookingRangeError();
    }

    const room = await deps.rooms.findById(input.roomId);
    if (!room) {
      throw new RoomNotFoundError(input.roomId);
    }

    const existing = await deps.bookings.findByRoomInRange(
      input.roomId,
      input.startTime,
      input.endTime,
    );
    if (findConflict(existing, input)) {
      throw new BookingConflictError();
    }

    // The adapter re-checks overlap inside its own transaction to close the
    // race-condition window between this check and the insert.
    return deps.bookings.create(input);
  };
}
