import { and, eq, gt, lt } from "drizzle-orm";
import type { BookingRepository } from "@/core/ports/booking-repository.port";
import type { Booking, NewBooking } from "@/core/domain/entities/booking";
import { BookingConflictError } from "@/core/domain/errors";
import { db } from "./client";
import { bookings } from "./schema/app-schema";

function overlapCondition(roomId: string, start: Date, end: Date) {
  return and(
    eq(bookings.roomId, roomId),
    lt(bookings.startTime, end),
    gt(bookings.endTime, start),
  );
}

export class DrizzleBookingRepository implements BookingRepository {
  async findByRoomInRange(roomId: string, start: Date, end: Date): Promise<Booking[]> {
    return db.select().from(bookings).where(overlapCondition(roomId, start, end));
  }

  async findInRange(start: Date, end: Date, roomId?: string): Promise<Booking[]> {
    const conditions = [lt(bookings.startTime, end), gt(bookings.endTime, start)];
    if (roomId) conditions.push(eq(bookings.roomId, roomId));
    return db
      .select()
      .from(bookings)
      .where(and(...conditions));
  }

  async create(newBooking: NewBooking): Promise<Booking> {
    return db.transaction(async (tx) => {
      const conflicts = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(overlapCondition(newBooking.roomId, newBooking.startTime, newBooking.endTime))
        .limit(1);

      if (conflicts.length > 0) {
        throw new BookingConflictError();
      }

      const [created] = await tx.insert(bookings).values(newBooking).returning();
      return created;
    });
  }
}
