import { DrizzleRoomRepository } from "@/adapters/driven/drizzle/room-repository.drizzle";
import { DrizzleBookingRepository } from "@/adapters/driven/drizzle/booking-repository.drizzle";
import { DrizzleUserRepository } from "@/adapters/driven/drizzle/user-repository.drizzle";
import { BetterAuthService } from "@/adapters/driven/better-auth/auth-service.adapter";
import { SystemClock } from "@/adapters/driven/system-clock";
import { makeCreateBooking } from "@/core/use-cases/create-booking.use-case";
import { makeCancelBooking } from "@/core/use-cases/cancel-booking.use-case";
import { makeListRoomsWithStatus } from "@/core/use-cases/list-rooms-with-status.use-case";
import { makeListBookingsInRange } from "@/core/use-cases/list-bookings-in-range.use-case";
import { makeCreateRoom } from "@/core/use-cases/create-room.use-case";
import { makeUpdateRoom } from "@/core/use-cases/update-room.use-case";
import { makeDeleteRoom } from "@/core/use-cases/delete-room.use-case";
import { makeListUsers } from "@/core/use-cases/list-users.use-case";
import { makeSetUserRole } from "@/core/use-cases/set-user-role.use-case";

const roomRepository = new DrizzleRoomRepository();
const bookingRepository = new DrizzleBookingRepository();
const userRepository = new DrizzleUserRepository();
const authService = new BetterAuthService();
const clock = new SystemClock();

export const container = {
  authService,
  createBooking: makeCreateBooking({
    bookings: bookingRepository,
    rooms: roomRepository,
    clock,
  }),
  cancelBooking: makeCancelBooking({ bookings: bookingRepository, clock }),
  listRoomsWithStatus: makeListRoomsWithStatus({
    rooms: roomRepository,
    bookings: bookingRepository,
    clock,
  }),
  listBookingsInRange: makeListBookingsInRange({ bookings: bookingRepository }),
  getRoomById: (id: string) => roomRepository.findById(id),
  listRoomsPlain: () => roomRepository.findAll(),
  createRoom: makeCreateRoom({ rooms: roomRepository }),
  updateRoom: makeUpdateRoom({ rooms: roomRepository }),
  deleteRoom: makeDeleteRoom({ rooms: roomRepository }),
  listUsers: makeListUsers({ users: userRepository }),
  setUserRole: makeSetUserRole({ users: userRepository }),
};
