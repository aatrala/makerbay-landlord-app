import { nightsBetween, nightsWithin } from "./dates.js";

export type MetricBooking = {
  listingId: string;
  status: "tentative" | "confirmed" | "blocked" | "cancelled";
  checkIn: string;
  checkOut: string;
  accommodationTotal: number;
  cleaningFee: number;
  platformFee: number;
};

export type ListingMetrics = {
  listingId: string;
  nightsAvailable: number;
  nightsBooked: number;
  nightsBlocked: number;
  occupancy: number; // 0..1, booked / (range - blocked)
  accommodationRevenue: number;
  cleaningRevenue: number;
  platformFees: number;
  grossRevenue: number;
  adr: number; // average daily rate = accommodation revenue / booked nights
  revpar: number; // accommodation revenue / available nights
  bookings: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Per-listing metrics for [from, to). Accommodation revenue is attributed per
 * night (so stays spanning months split fairly); cleaning fee and platform fee
 * are attributed to the checkout date.
 */
export function computeListingMetrics(
  listingId: string,
  bookings: MetricBooking[],
  from: string,
  to: string,
): ListingMetrics {
  const rangeNights = nightsBetween(from, to);
  let booked = 0,
    blocked = 0,
    accommodation = 0,
    cleaning = 0,
    fees = 0,
    count = 0;
  for (const b of bookings) {
    if (b.listingId !== listingId || b.status === "cancelled") continue;
    const inRange = nightsWithin(b.checkIn, b.checkOut, from, to);
    if (b.status === "blocked") {
      blocked += inRange;
      continue;
    }
    if (b.status !== "confirmed") continue;
    const total = nightsBetween(b.checkIn, b.checkOut);
    if (inRange > 0) {
      booked += inRange;
      accommodation += total > 0 ? (b.accommodationTotal * inRange) / total : 0;
    }
    if (b.checkOut > from && b.checkOut <= to) {
      cleaning += b.cleaningFee;
      fees += b.platformFee;
      count++;
    }
  }
  const available = Math.max(0, rangeNights - blocked);
  return {
    listingId,
    nightsAvailable: available,
    nightsBooked: booked,
    nightsBlocked: blocked,
    occupancy: available ? round2(booked / available) : 0,
    accommodationRevenue: round2(accommodation),
    cleaningRevenue: round2(cleaning),
    platformFees: round2(fees),
    grossRevenue: round2(accommodation + cleaning),
    adr: booked ? round2(accommodation / booked) : 0,
    revpar: available ? round2(accommodation / available) : 0,
    bookings: count,
  };
}

export type StatementLine = {
  listingId: string;
  listingName: string;
  metrics: ListingMetrics;
  managementFeePct: number;
  managementFee: number;
  expenses: number;
  turnoverCosts: number;
  net: number;
};

export function statementLine(
  listingId: string,
  listingName: string,
  metrics: ListingMetrics,
  managementFeePct: number,
  expenses: number,
  turnoverCosts: number,
): StatementLine {
  const managementFee = round2((metrics.accommodationRevenue * managementFeePct) / 100);
  const net = round2(
    metrics.grossRevenue - metrics.platformFees - managementFee - expenses - turnoverCosts,
  );
  return {
    listingId,
    listingName,
    metrics,
    managementFeePct,
    managementFee,
    expenses: round2(expenses),
    turnoverCosts: round2(turnoverCosts),
    net,
  };
}
