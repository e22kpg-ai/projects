export interface TimeRange {
  startTime: Date;
  endTime: Date;
}

/**
 * Two ranges overlap when one starts before the other ends, on both sides.
 * Uses strict < so back-to-back bookings (e.g. 14:00-15:00 and 15:00-16:00) don't count as overlapping.
 */
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

export function findConflict<T extends TimeRange>(
  existing: T[],
  candidate: TimeRange,
): T | undefined {
  return existing.find((booking) => overlaps(booking, candidate));
}
