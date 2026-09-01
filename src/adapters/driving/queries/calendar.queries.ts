import { container } from "@/composition/container";

export interface CalendarQueryParams {
  date: string; // YYYY-MM-DD
  roomId?: string;
}

export async function getCalendarData({ date, roomId }: CalendarQueryParams) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T00:00:00`);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [rooms, bookings] = await Promise.all([
    container.listRoomsWithStatus(),
    container.listBookingsInRange({ start: dayStart, end: dayEnd, roomId }),
  ]);

  return { rooms, bookings, dayStart, dayEnd };
}
