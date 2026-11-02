import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Link2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input, Label, Select, Textarea } from "../../components/ui/Input";
import { PageHeader, SOURCES, money, num, sourceLabel, strOrNull, useForm, useListings, type Listing } from "./shared";

type Property = { id: string; name: string; units: { id: string; unitNumber: string }[] };
type Owner = { id: string; name: string };

const emptyListing = {
  unitId: "",
  homeownerId: "",
  name: "",
  nightlyRate: "",
  minStay: "1",
  cleaningFee: "0",
  maxGuests: "",
  checkInTime: "15:00",
  checkOutTime: "10:00",
  houseRules: "",
  checkInInstructions: "",
  managementFeePct: "",
};

function ListingForm({ initial, onDone }: { initial?: Listing; onDone: () => void }) {
  const qc = useQueryClient();
  const props = useQuery({ queryKey: ["properties"], queryFn: () => api.get<{ data: Property[] }>("/api/properties") });
  const owners = useQuery({ queryKey: ["str", "homeowners"], queryFn: () => api.get<{ data: Owner[] }>("/api/str/homeowners") });
  const f = useForm<Record<string, string>>(
    initial
      ? {
          ...emptyListing,
          ...Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, v === null || v === undefined ? "" : String(v)])),
        }
      : emptyListing,
  );
  const unitOptions = useMemo(
    () =>
      (props.data?.data ?? []).flatMap((p) =>
        p.units.map((u) => ({ value: u.id, label: `${p.name} — Unit ${u.unitNumber}` })),
      ),
    [props.data],
  );
  const save = useMutation({
    mutationFn: () => {
      const v = f.values;
      const body = {
        homeownerId: v.homeownerId || null,
        name: v.name,
        nightlyRate: Number(v.nightlyRate),
        minStay: Number(v.minStay || 1),
        cleaningFee: Number(v.cleaningFee || 0),
        maxGuests: num(v.maxGuests) ?? null,
        checkInTime: v.checkInTime,
        checkOutTime: v.checkOutTime,
        houseRules: strOrNull(v.houseRules),
        checkInInstructions: strOrNull(v.checkInInstructions),
        managementFeePct: num(v.managementFeePct) ?? null,
      };
      return initial
        ? api.put(`/api/str/listings/${initial.id}`, body)
        : api.post("/api/str/listings", { ...body, unitId: v.unitId });
    },
    onSuccess: () => {
      toast.success("Listing saved");
      qc.invalidateQueries({ queryKey: ["str"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card className="mb-6">
      <form
        className="grid gap-4 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {!initial && (
          <div className="space-y-1.5 md:col-span-2">
            <Label>Unit (create properties/units under Properties)</Label>
            <Select required options={unitOptions} placeholder="Choose a unit" {...f.bind("unitId")} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Listing name</Label>
          <Input required {...f.bind("name")} />
        </div>
        <div className="space-y-1.5">
          <Label>Nightly rate</Label>
          <Input required type="number" min="0" step="0.01" {...f.bind("nightlyRate")} />
        </div>
        <div className="space-y-1.5">
          <Label>Minimum stay (nights)</Label>
          <Input type="number" min="1" {...f.bind("minStay")} />
        </div>
        <div className="space-y-1.5">
          <Label>Cleaning fee</Label>
          <Input type="number" min="0" step="0.01" {...f.bind("cleaningFee")} />
        </div>
        <div className="space-y-1.5">
          <Label>Max guests</Label>
          <Input type="number" min="1" {...f.bind("maxGuests")} />
        </div>
        <div className="space-y-1.5">
          <Label>Check-in time</Label>
          <Input type="time" {...f.bind("checkInTime")} />
        </div>
        <div className="space-y-1.5">
          <Label>Check-out time</Label>
          <Input type="time" {...f.bind("checkOutTime")} />
        </div>
        <div className="space-y-1.5">
          <Label>Owner</Label>
          <Select
            options={[{ value: "", label: "— Self-managed —" }, ...(owners.data?.data ?? []).map((o) => ({ value: o.id, label: o.name }))]}
            {...f.bind("homeownerId")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Management fee % (overrides owner)</Label>
          <Input type="number" min="0" max="100" step="0.1" {...f.bind("managementFeePct")} />
        </div>
        <div className="space-y-1.5 md:col-span-3">
          <Label>House rules</Label>
          <Textarea {...f.bind("houseRules")} />
        </div>
        <div className="space-y-1.5 md:col-span-3">
          <Label>Check-in instructions (used in guest messages)</Label>
          <Textarea {...f.bind("checkInInstructions")} />
        </div>
        <div className="flex gap-2 md:col-span-3">
          <Button type="submit" variant="signal" loading={save.isPending}>
            Save listing
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Feeds({ l }: { l: Listing }) {
  const qc = useQueryClient();
  const [source, setSource] = useState("airbnb");
  const [url, setUrl] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["str"] });
  const add = useMutation({
    mutationFn: () => api.post(`/api/str/listings/${l.id}/feeds`, { source, url }),
    onSuccess: () => {
      setUrl("");
      toast.success("Feed added — syncing daily");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const sync = useMutation({
    mutationFn: (id: string) => api.post<{ data: { imported: number; updated: number; cancelled: number; conflicts: unknown[] } }>(`/api/str/feeds/${id}/sync`),
    onSuccess: (r) => {
      const d = r.data;
      toast.success(`Synced: ${d.imported} new, ${d.updated} updated, ${d.cancelled} cancelled`);
      if (d.conflicts?.length) toast.warning(`${d.conflicts.length} double-booking conflict(s) detected`);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: (id: string) => api.delete(`/api/str/feeds/${id}`), onSuccess: refresh });
  const exportUrl = `${window.location.origin}/api/ical/${l.icalToken}.ics`;
  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      <div>
        <p className="text-xs font-semibold uppercase text-muted">Export calendar (paste into Airbnb / Booking.com / VRBO)</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-gray-50 px-2 py-1 text-xs">{exportUrl}</code>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(exportUrl).then(() => toast.success("Copied"))}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-muted">Import calendars</p>
        <ul className="mt-1 space-y-1">
          {(l.calendarFeeds ?? []).map((f) => (
            <li key={f.id} className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{sourceLabel(f.source)}</Badge>
              <span className="flex-1 truncate text-muted">{f.url}</span>
              {f.lastStatus && (
                <Badge variant={f.lastStatus.startsWith("ok") ? "success" : "danger"} title={f.lastError ?? ""}>
                  {f.lastStatus}
                </Badge>
              )}
              <Button size="sm" variant="ghost" onClick={() => sync.mutate(f.id)} loading={sync.isPending && sync.variables === f.id}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => del.mutate(f.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="mt-2 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <Select className="w-36" options={SOURCES.filter((s) => s.value !== "direct")} value={source} onChange={(e) => setSource(e.target.value)} />
          <Input className="min-w-60 flex-1" placeholder="https://… .ics feed URL" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <Button size="md" type="submit" variant="secondary" loading={add.isPending}>
            <Link2 className="h-4 w-4" /> Add feed
          </Button>
        </form>
      </div>
    </div>
  );
}

export function Listings() {
  const { data, isLoading } = useListings();
  const [editing, setEditing] = useState<Listing | "new" | null>(null);
  return (
    <div>
      <PageHeader
        title="Listings"
        subtitle="Short-stay listings, rates and channel calendars"
        action={
          editing ? (
            <Button variant="ghost" onClick={() => setEditing(null)}>
              <X className="h-4 w-4" /> Close
            </Button>
          ) : (
            <Button variant="signal" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> New listing
            </Button>
          )
        }
      />
      {editing && <ListingForm initial={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      {isLoading && <p className="text-muted">Loading…</p>}
      {data?.data.length === 0 && !editing && (
        <Card className="text-center text-muted">No listings yet. Add a property and unit, then create a listing for it.</Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.data.map((l) => (
          <Card key={l.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-ink">{l.name}</h3>
                <p className="text-sm text-muted">
                  {l.property?.name}
                  {l.unit ? ` · Unit ${l.unit.unitNumber}` : ""}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(l)}>
                Edit
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Badge variant="signal">{money(l.nightlyRate)}/night</Badge>
              <Badge>min {l.minStay} nights</Badge>
              <Badge>cleaning {money(l.cleaningFee)}</Badge>
              <Badge variant="outline">
                in {l.checkInTime} · out {l.checkOutTime}
              </Badge>
              {!l.active && <Badge variant="danger">inactive</Badge>}
            </div>
            <Feeds l={l} />
          </Card>
        ))}
      </div>
    </div>
  );
}
