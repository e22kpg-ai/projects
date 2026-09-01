import { DrizzleRoomRepository } from "@/adapters/driven/drizzle/room-repository.drizzle";
import { DrizzleBookingRepository } from "@/adapters/driven/drizzle/booking-repository.drizzle";
import { BetterAuthService } from "@/adapters/driven/better-auth/auth-service.adapter";
import { SystemClock } from "@/adapters/driven/system-clock";
import { makeCreateBooking } from "@/core/use-cases/create-booking.use-case";
import { makeListRoomsWithStatus } from "@/core/use-cases/list-rooms-with-status.use-case";
import { makeListBookingsInRange } from "@/core/use-cases/list-bookings-in-range.use-case";

const roomRepository = new DrizzleRoomRepository();
const bookingRepository = new DrizzleBookingRepository();
const authService = new BetterAuthService();
const clock = new SystemClock();

export const container = {
  authService,
  createBooking: makeCreateBooking({ bookings: bookingRepository, rooms: roomRepository }),
  listRoomsWithStatus: makeListRoomsWithStatus({
    rooms: roomRepository,
    bookings: bookingRepository,
    clock,
  }),
  listBookingsInRange: makeListBookingsInRange({ bookings: bookingRepository }),
  getRoomById: (id: string) => roomRepository.findById(id),
};
