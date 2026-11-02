import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";

export type Listing = {
  id: string;
  name: string;
  unitId: string;
  propertyId: string;
  homeownerId: string | null;
  nightlyRate: number;
  minStay: number;
  cleaningFee: number;
  maxGuests: number | null;
  houseRules: string | null;
  checkInTime: string;
  checkOutTime: string;
  checkInInstructions: string | null;
  managementFeePct: number | null;
  icalToken: string;
  active: boolean;
  property?: { name: string; address: string };
  unit?: { unitNumber: string };
  calendarFeeds?: Feed[];
};
export type Feed = {
  id: string;
  source: string;
  url: string;
  lastSyncedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
};
export type Guest = { id: string; firstName: string; lastName: string | null; email: string | null; phone: string | null; notes: string | null };
export type Booking = {
  id: string;
  listingId: string;
  guestId: string | null;
  source: string;
  status: "tentative" | "confirmed" | "blocked" | "cancelled";
  checkIn: string;
  checkOut: string;
  numGuests: number | null;
  accommodationTotal: number;
  cleaningFee: number;
  platformFee: number;
  summary: string | null;
  notes: string | null;
  guest?: Guest | null;
  listing?: { name: string };
};

export const SOURCES = [
  { value: "direct", label: "Direct" },
  { value: "airbnb", label: "Airbnb" },
  { value: "booking_com", label: "Booking.com" },
  { value: "vrbo", label: "VRBO" },
  { value: "other", label: "Other" },
];
export const sourceLabel = (s: string) => SOURCES.find((x) => x.value === s)?.label ?? s;

export function useListings() {
  return useQuery({ queryKey: ["str", "listings"], queryFn: () => api.get<{ data: Listing[] }>("/api/str/listings") });
}
export function useGuests() {
  return useQuery({ queryKey: ["str", "guests"], queryFn: () => api.get<{ data: Guest[] }>("/api/str/guests") });
}

export const todayIso = () => new Date().toISOString().slice(0, 10);
export function addDaysIso(d: string, n: number) {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}
// Same currency formatting as the rest of the app.
export const money = (n: number) => formatCurrency(n || 0);

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Small form-state helper. */
export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const bind = (k: keyof T) => ({
    value: (values[k] ?? "") as string | number,
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value })),
  });
  return { values, setValues, bind, reset: () => setValues(initial) };
}

export const num = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));
export const strOrNull = (v: unknown) => (v === "" || v === undefined ? null : String(v));
