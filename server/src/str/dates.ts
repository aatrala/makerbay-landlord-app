const DAY = 86_400_000;

/** Parse YYYY-MM-DD as a UTC midnight timestamp. */
export function toUtc(d: string): number {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}

export function fromUtc(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function addDays(d: string, n: number): string {
  return fromUtc(toUtc(d) + n * DAY);
}

/** Nights in a half-open stay [checkIn, checkOut). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(0, Math.round((toUtc(checkOut) - toUtc(checkIn)) / DAY));
}

/** Two half-open ranges overlap when a.start < b.end && b.start < a.end. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Nights of [checkIn, checkOut) that fall inside [from, to). */
export function nightsWithin(checkIn: string, checkOut: string, from: string, to: string): number {
  const start = checkIn > from ? checkIn : from;
  const end = checkOut < to ? checkOut : to;
  return start < end ? nightsBetween(start, end) : 0;
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
