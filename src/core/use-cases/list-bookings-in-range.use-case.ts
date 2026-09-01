import type { Booking } from "@/core/domain/entities/booking";
import type { BookingRepository } from "@/core/ports/booking-repository.port";

export interface ListBookingsInRangeDeps {
  bookings: BookingRepository;
}

export interface ListBookingsInRangeInput {
  start: Date;
  end: Date;
  roomId?: string;
}

export function makeListBookingsInRange(deps: ListBookingsInRangeDeps) {
  return async function listBookingsInRange(
    input: ListBookingsInRangeInput,
  ): Promise<Booking[]> {
    return deps.bookings.findInRange(input.start, input.end, input.roomId);
  };
}
