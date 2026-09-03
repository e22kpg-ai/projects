import type { Booking, NewBooking } from "@/core/domain/entities/booking";

export interface BookingRepository {
  findById(id: string): Promise<Booking | undefined>;
  findByRoomInRange(roomId: string, start: Date, end: Date): Promise<Booking[]>;
  findInRange(start: Date, end: Date, roomId?: string): Promise<Booking[]>;
  /**
   * Implementations must re-check for overlap inside the same transaction as the
   * insert (SQLite has no exclusion constraint), and throw BookingConflictError
   * if a conflict is found at that point.
   */
  create(booking: NewBooking): Promise<Booking>;
  delete(id: string): Promise<void>;
}
