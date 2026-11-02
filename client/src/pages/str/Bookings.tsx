import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input, Label, Select, Textarea } from "../../components/ui/Input";
import {
  PageHeader,
  SOURCES,
  addDaysIso,
  money,
  num,
  sourceLabel,
  strOrNull,
  todayIso,
  useForm,
  useGuests,
  useListings,
  type Booking,
} from "./shared";

type CalendarData = { from: string; to: string; listings: { id: string; name: string; bookings: Booking[] }[] };

const sourceColor: Record<string, string> = {
  direct: "bg-emerald-500",
  airbnb: "bg-rose-500",
  booking_com: "bg-blue-600",
  vrbo: "bg-indigo-500",
  other: "bg-slate-500",
};

function BookingForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const listings = useListings();
  const guests = useGuests();
  const f = useForm<Record<string, string>>({
    listingId: "",
    guestId: "",
    source: "direct",
    status: "confirmed",
    checkIn: todayIso(),
    checkOut: addDaysIso(todayIso(), 2),
    numGuests: "",
    platformFee: "",
    accommodationTotal: "",
    notes: "",
  });
  const [conflicts, setConflicts] = useState<Booking[] | null>(null);
  const body = (allowShortStay = false) => ({
    listingId: f.values.listingId,
    guestId: f.values.guestId || null,
    source: f.values.source,
    status: f.values.status,
    checkIn: f.values.checkIn,
    checkOut: f.values.checkOut,
    numGuests: num(f.values.numGuests) ?? null,
    platformFee: num(f.values.platformFee) ?? 0,
    accommodationTotal: num(f.values.accommodationTotal),
    notes: strOrNull(f.values.notes),
    allowShortStay,
  });
  const submit = async (allowShortStay: boolean): Promise<unknown> => {
      const res = await fetch("/api/str/bookings", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body(allowShortStay)),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setConflicts(json.conflicts ?? []);
        throw new Error("Those dates overlap an existing booking or block");
      }
      if (res.status === 400 && json.code === "MIN_STAY") {
        if (window.confirm(`${json.message}. Book anyway?`)) return submit(true);
        throw new Error(json.message);
      }
      if (!res.ok) throw new Error(json.message || "Failed to save booking");
      return json;
  };
  const save = useMutation({
    mutationFn: submit,
    onSuccess: () => {
      toast.success("Booking saved — turnover task created");
      qc.invalidateQueries({ queryKey: ["str"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const listingOpts = (listings.data?.data ?? []).map((l) => ({ value: l.id, label: l.name }));
  const guestOpts = [
    { value: "", label: "— none —" },
    ...(guests.data?.data ?? []).map((g) => ({ value: g.id, label: `${g.firstName} ${g.lastName ?? ""}`.trim() })),
  ];
  return (
    <Card className="mb-6">
      <form
        className="grid gap-4 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setConflicts(null);
          save.mutate(false);
        }}
      >
        <div className="space-y-1.5 md:col-span-2">
          <Label>Listing</Label>
          <Select required options={listingOpts} placeholder="Choose listing" {...f.bind("listingId")} />
        </div>
        <div className="space-y-1.5">
          <Label>Guest</Label>
          <Select options={guestOpts} {...f.bind("guestId")} />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            options={[
              { value: "confirmed", label: "Confirmed stay" },
              { value: "tentative", label: "Tentative hold" },
              { value: "blocked", label: "Owner block" },
            ]}
            {...f.bind("status")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Check-in</Label>
          <Input type="date" required {...f.bind("checkIn")} />
        </div>
        <div className="space-y-1.5">
          <Label>Check-out</Label>
          <Input type="date" required {...f.bind("checkOut")} />
        </div>
        <div className="space-y-1.5">
          <Label>Channel</Label>
          <Select options={SOURCES} {...f.bind("source")} />
        </div>
        <div className="space-y-1.5">
          <Label>Guests</Label>
          <Input type="number" min="1" {...f.bind("numGuests")} />
        </div>
        <div className="space-y-1.5">
          <Label>Accommodation total (blank = nightly rate × nights)</Label>
          <Input type="number" min="0" step="0.01" {...f.bind("accommodationTotal")} />
        </div>
        <div className="space-y-1.5">
          <Label>Channel/platform fee</Label>
          <Input type="number" min="0" step="0.01" {...f.bind("platformFee")} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Notes</Label>
          <Textarea className="min-h-10" {...f.bind("notes")} />
        </div>
        {conflicts && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 md:col-span-4">
            Conflicts with:{" "}
            {conflicts.map((c) => `${c.checkIn} → ${c.checkOut} (${sourceLabel(c.source)}, ${c.status})`).join("; ")}
          </div>
        )}
        <div className="flex gap-2 md:col-span-4">
          <Button type="submit" variant="signal" loading={save.isPending}>
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CalendarGrid({ start, days }: { start: string; days: number }) {
  const to = addDaysIso(start, days);
  const { data } = useQuery({
    queryKey: ["str", "calendar", start, days],
    queryFn: () => api.get<{ data: CalendarData }>("/api/str/calendar", { from: start, to }),
  });
  const dates = useMemo(() => Array.from({ length: days }, (_, i) => addDaysIso(start, i)), [start, days]);
  const today = todayIso();
  return (
    <Card padding="none" className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-40 bg-surface p-2 text-left">Listing</th>
            {dates.map((d) => (
              <th key={d} className={cn("min-w-8 p-1 text-center font-medium text-muted", d === today && "text-signal")}>
                {Number(d.slice(8))}
                <div className="text-[10px] opacity-60">
                  {new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "narrow", timeZone: "UTC" })}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.data.listings.map((l) => (
            <tr key={l.id} className="border-t border-line">
              <td className="sticky left-0 z-10 bg-surface p-2 font-semibold text-ink">{l.name}</td>
              {dates.map((d) => {
                const b = l.bookings.find((x) => x.checkIn <= d && d < x.checkOut);
                const starts = b && b.checkIn === d;
                return (
                  <td key={d} className="h-9 p-0">
                    {b && (
                      <div
                        title={`${b.summary ?? ""} ${b.checkIn} → ${b.checkOut} (${sourceLabel(b.source)})`}
                        className={cn(
                          "h-6 text-white",
                          b.status === "blocked" ? "bg-gray-400" : sourceColor[b.source] ?? "bg-slate-500",
                          b.status === "tentative" && "opacity-50",
                          starts && "ml-1 rounded-l-md",
                        )}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {data?.data.listings.length === 0 && <p className="p-6 text-center text-muted">No listings yet.</p>}
    </Card>
  );
}

export function Bookings() {
  const qc = useQueryClient();
  const [start, setStart] = useState(addDaysIso(todayIso(), -3));
  const [adding, setAdding] = useState(false);
  const list = useQuery({
    queryKey: ["str", "bookings", start],
    queryFn: () => api.get<{ data: Booking[] }>("/api/str/bookings", { from: start }),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => api.post(`/api/str/bookings/${id}/cancel`),
    onSuccess: () => {
      toast.success("Booking cancelled");
      qc.invalidateQueries({ queryKey: ["str"] });
    },
  });
  return (
    <div>
      <PageHeader
        title="Bookings calendar"
        subtitle="All channels in one place. Overlaps are rejected; imported conflicts are flagged on sync."
        action={
          <Button variant={adding ? "ghost" : "signal"} onClick={() => setAdding((a) => !a)}>
            {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {adding ? "Close" : "New booking / block"}
          </Button>
        }
      />
      {adding && <BookingForm onDone={() => setAdding(false)} />}
      <div className="mb-3 flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setStart(addDaysIso(start, -14))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setStart(addDaysIso(todayIso(), -3))}>
          Today
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setStart(addDaysIso(start, 14))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex flex-wrap gap-2 text-xs">
          {SOURCES.map((s) => (
            <span key={s.value} className="flex items-center gap-1">
              <span className={cn("h-3 w-3 rounded", sourceColor[s.value])} /> {s.label}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-gray-400" /> Blocked
          </span>
        </div>
      </div>
      <CalendarGrid start={start} days={35} />

      <h2 className="mb-3 mt-8 text-lg font-bold text-ink">Upcoming</h2>
      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Listing</th>
              <th className="p-3">Dates</th>
              <th className="p-3">Guest</th>
              <th className="p-3">Channel</th>
              <th className="p-3">Total</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {list.data?.data.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="p-3 font-semibold">{b.listing?.name}</td>
                <td className="p-3">
                  {b.checkIn} → {b.checkOut}
                </td>
                <td className="p-3">{b.guest ? `${b.guest.firstName} ${b.guest.lastName ?? ""}` : b.summary ?? "—"}</td>
                <td className="p-3">
                  <Badge variant={b.status === "blocked" ? "default" : "outline"}>
                    {b.status === "blocked" ? "Blocked" : sourceLabel(b.source)}
                  </Badge>
                  {b.status === "tentative" && <Badge variant="warning">tentative</Badge>}
                </td>
                <td className="p-3">{money(b.accommodationTotal + b.cleaningFee)}</td>
                <td className="p-3 text-right">
                  {b.source === "direct" || b.status === "blocked" ? (
                    <Button size="sm" variant="ghost" onClick={() => window.confirm("Cancel this booking?") && cancel.mutate(b.id)}>
                      Cancel
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">managed by channel</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data?.data.length === 0 && <p className="p-6 text-center text-muted">No upcoming bookings.</p>}
      </Card>
    </div>
  );
}
