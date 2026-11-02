import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Plus, Send, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input, Label, Select, Textarea } from "../../components/ui/Input";
import { StatCard } from "../../components/ui/StatCard";
import { PageHeader, money, num, sourceLabel, strOrNull, todayIso, useForm, useGuests, type Booking } from "./shared";

const invalidate = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: ["str"] });
const onErr = (e: Error) => toast.error(e.message);

// ───────────────────────── Guests ─────────────────────────

export function Guests() {
  const qc = useQueryClient();
  const { data } = useGuests();
  const f = useForm({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
  const add = useMutation({
    mutationFn: () =>
      api.post("/api/str/guests", {
        firstName: f.values.firstName,
        lastName: strOrNull(f.values.lastName),
        email: strOrNull(f.values.email),
        phone: strOrNull(f.values.phone),
        notes: strOrNull(f.values.notes),
      }),
    onSuccess: () => {
      f.reset();
      toast.success("Guest added");
      invalidate(qc);
    },
    onError: onErr,
  });
  const del = useMutation({ mutationFn: (id: string) => api.delete(`/api/str/guests/${id}`), onSuccess: () => invalidate(qc), onError: onErr });
  return (
    <div>
      <PageHeader title="Guests" subtitle="Guest records for direct and channel stays (private — never exported in calendars)" />
      <Card className="mb-6">
        <form
          className="grid gap-3 md:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <Input placeholder="First name" required {...f.bind("firstName")} />
          <Input placeholder="Last name" {...f.bind("lastName")} />
          <Input placeholder="Email" type="email" {...f.bind("email")} />
          <Input placeholder="Phone" {...f.bind("phone")} />
          <Button type="submit" variant="signal" loading={add.isPending}>
            <Plus className="h-4 w-4" /> Add guest
          </Button>
        </form>
      </Card>
      <Card padding="none">
        <table className="w-full text-sm">
          <tbody>
            {data?.data.map((g) => (
              <tr key={g.id} className="border-t border-line first:border-0">
                <td className="p-3 font-semibold">
                  {g.firstName} {g.lastName}
                </td>
                <td className="p-3 text-muted">{g.email}</td>
                <td className="p-3 text-muted">{g.phone}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => window.confirm("Delete guest?") && del.mutate(g.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.data.length === 0 && <p className="p-6 text-center text-muted">No guests yet.</p>}
      </Card>
    </div>
  );
}

// ───────────────────────── Turnovers ─────────────────────────

type Turnover = {
  id: string;
  dueDate: string;
  nextCheckIn: string | null;
  status: string;
  cost: number | null;
  notes: string | null;
  vendorId: string | null;
  listing: { name: string; checkOutTime: string; checkInTime: string };
  vendor: { name: string } | null;
};

const statusVariant = (s: string) =>
  s === "done" ? "success" : s === "cancelled" ? "default" : s === "pending" ? "warning" : "signal";

export function Turnovers() {
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const { data } = useQuery({
    queryKey: ["str", "turnovers", showAll],
    queryFn: () => api.get<{ data: Turnover[] }>("/api/str/turnovers", showAll ? {} : { from: todayIso() }),
  });
  const vendors = useQuery({ queryKey: ["vendors"], queryFn: () => api.get<{ data: { id: string; name: string }[] }>("/api/vendors") });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) => api.put(`/api/str/turnovers/${id}`, body),
    onSuccess: () => {
      toast.success("Turnover updated");
      invalidate(qc);
    },
    onError: onErr,
  });
  const vendorOpts = [{ value: "", label: "Unassigned" }, ...(vendors.data?.data ?? []).map((v) => ({ value: v.id, label: v.name }))];
  return (
    <div>
      <PageHeader
        title="Turnovers"
        subtitle="Cleaning tasks are created automatically for every confirmed checkout. Add cleaners under Maintenance → vendors."
        action={
          <Button variant="secondary" onClick={() => setShowAll((s) => !s)}>
            {showAll ? "Upcoming only" : "Show past"}
          </Button>
        }
      />
      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Listing</th>
              <th className="p-3">Window</th>
              <th className="p-3">Cleaner</th>
              <th className="p-3">Cost</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="p-3 font-semibold">{t.dueDate}</td>
                <td className="p-3">{t.listing.name}</td>
                <td className="p-3 text-muted">
                  {t.listing.checkOutTime} → {t.nextCheckIn ? <Badge variant="danger">same-day {t.listing.checkInTime}</Badge> : "no arrival"}
                </td>
                <td className="p-3">
                  <Select
                    className="h-8 w-40"
                    options={vendorOpts}
                    value={t.vendorId ?? ""}
                    onChange={(e) =>
                      update.mutate({
                        id: t.id,
                        vendorId: e.target.value || null,
                        notifyVendor: !!e.target.value && window.confirm("Email the cleaner about this job?"),
                      })
                    }
                  />
                </td>
                <td className="p-3">
                  <Input
                    className="h-8 w-24"
                    type="number"
                    min="0"
                    defaultValue={t.cost ?? ""}
                    onBlur={(e) => {
                      const v = num(e.target.value) ?? null;
                      if (v !== t.cost) update.mutate({ id: t.id, cost: v });
                    }}
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(t.status) as "success"}>{t.status.replace("_", " ")}</Badge>
                    {t.status !== "done" && t.status !== "cancelled" && (
                      <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: t.id, status: "done" })}>
                        Mark done
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.data.length === 0 && <p className="p-6 text-center text-muted">No turnovers scheduled.</p>}
      </Card>
    </div>
  );
}

// ───────────────────────── Reports ─────────────────────────

type MetricRow = {
  listingId: string;
  name: string;
  nightsBooked: number;
  nightsAvailable: number;
  occupancy: number;
  adr: number;
  revpar: number;
  grossRevenue: number;
  platformFees: number;
  bookings: number;
};

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Input type="month" className="w-44" value={value} onChange={(e) => onChange(e.target.value)} />;
}
const thisMonth = () => todayIso().slice(0, 7);
const ym = (m: string) => ({ year: Number(m.slice(0, 4)), month: Number(m.slice(5, 7)) });
const pct = (n: number) => `${Math.round(n * 100)}%`;

export function StrReports() {
  const [month, setMonth] = useState(thisMonth());
  const { data } = useQuery({
    queryKey: ["str", "reports", month],
    queryFn: () =>
      api.get<{ data: { listings: MetricRow[]; totals: { occupancy: number; adr: number; grossRevenue: number; nightsBooked: number } } }>(
        "/api/str/reports/listings",
        ym(month),
      ),
  });
  const t = data?.data.totals;
  return (
    <div>
      <PageHeader title="Short-stay reports" subtitle="Income, occupancy and ADR per listing" action={<MonthPicker value={month} onChange={setMonth} />} />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Gross revenue" value={money(t?.grossRevenue ?? 0)} icon={<span>$</span>} />
        <StatCard label="Occupancy" value={pct(t?.occupancy ?? 0)} icon={<span>%</span>} />
        <StatCard label="ADR" value={money(t?.adr ?? 0)} icon={<span>↗</span>} />
        <StatCard label="Nights booked" value={String(t?.nightsBooked ?? 0)} icon={<span>☾</span>} />
      </div>
      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Listing</th>
              <th className="p-3">Bookings</th>
              <th className="p-3">Nights</th>
              <th className="p-3">Occupancy</th>
              <th className="p-3">ADR</th>
              <th className="p-3">RevPAR</th>
              <th className="p-3">Gross</th>
              <th className="p-3">Channel fees</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.listings.map((r) => (
              <tr key={r.listingId} className="border-t border-line">
                <td className="p-3 font-semibold">{r.name}</td>
                <td className="p-3">{r.bookings}</td>
                <td className="p-3">
                  {r.nightsBooked}/{r.nightsAvailable}
                </td>
                <td className="p-3">{pct(r.occupancy)}</td>
                <td className="p-3">{money(r.adr)}</td>
                <td className="p-3">{money(r.revpar)}</td>
                <td className="p-3">{money(r.grossRevenue)}</td>
                <td className="p-3">{money(r.platformFees)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ───────────────────────── Owners & statements ─────────────────────────

type Owner = { id: string; name: string; email: string | null; managementFeePct: number };
type Statement = {
  homeowner: Owner;
  from: string;
  to: string;
  lines: {
    listingId: string;
    name: string;
    metrics: { grossRevenue: number; platformFees: number; nightsBooked: number };
    managementFee: number;
    expenses: number;
    turnoverCosts: number;
    net: number;
  }[];
  totals: { grossRevenue: number; platformFees: number; managementFee: number; expenses: number; turnoverCosts: number; netPayout: number };
};

export function Owners() {
  const qc = useQueryClient();
  const owners = useQuery({ queryKey: ["str", "homeowners"], queryFn: () => api.get<{ data: Owner[] }>("/api/str/homeowners") });
  const f = useForm({ name: "", email: "", managementFeePct: "20" });
  const [selected, setSelected] = useState<string | null>(null);
  const [month, setMonth] = useState(thisMonth());
  const add = useMutation({
    mutationFn: () =>
      api.post("/api/str/homeowners", { name: f.values.name, email: strOrNull(f.values.email), managementFeePct: Number(f.values.managementFeePct || 0) }),
    onSuccess: () => {
      f.reset();
      invalidate(qc);
    },
    onError: onErr,
  });
  const st = useQuery({
    enabled: !!selected,
    queryKey: ["str", "statement", selected, month],
    queryFn: () => api.get<{ data: Statement }>(`/api/str/homeowners/${selected}/statement`, ym(month)),
  });
  const s = st.data?.data;
  return (
    <div>
      <PageHeader title="Owners & statements" subtitle="Monthly owner statements: revenue minus channel fees, management fee, expenses and cleaning" />
      <Card className="mb-6">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <Input placeholder="Owner name" required {...f.bind("name")} />
          <Input placeholder="Email" type="email" {...f.bind("email")} />
          <Input placeholder="Management fee %" type="number" min="0" max="100" {...f.bind("managementFeePct")} />
          <Button type="submit" variant="signal" loading={add.isPending}>
            <Plus className="h-4 w-4" /> Add owner
          </Button>
        </form>
      </Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {owners.data?.data.map((o) => (
          <Button key={o.id} size="sm" variant={selected === o.id ? "primary" : "secondary"} onClick={() => setSelected(o.id)}>
            {o.name} · {o.managementFeePct}%
          </Button>
        ))}
        {selected && <MonthPicker value={month} onChange={setMonth} />}
        {s && (
          <Button size="sm" variant="ghost" onClick={() => window.print()}>
            Print / PDF
          </Button>
        )}
      </div>
      {s && (
        <Card>
          <h2 className="text-lg font-bold">
            Statement — {s.homeowner.name} ({s.from} to {s.to}, exclusive)
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="py-2">Listing</th>
                <th>Nights</th>
                <th>Gross</th>
                <th>Channel fees</th>
                <th>Mgmt fee</th>
                <th>Expenses</th>
                <th>Cleaning</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {s.lines.map((l) => (
                <tr key={l.listingId} className="border-t border-line">
                  <td className="py-2 font-semibold">{l.name}</td>
                  <td>{l.metrics.nightsBooked}</td>
                  <td>{money(l.metrics.grossRevenue)}</td>
                  <td>−{money(l.metrics.platformFees)}</td>
                  <td>−{money(l.managementFee)}</td>
                  <td>−{money(l.expenses)}</td>
                  <td>−{money(l.turnoverCosts)}</td>
                  <td className="font-bold">{money(l.net)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-ink font-bold">
                <td className="py-2">Total</td>
                <td />
                <td>{money(s.totals.grossRevenue)}</td>
                <td>−{money(s.totals.platformFees)}</td>
                <td>−{money(s.totals.managementFee)}</td>
                <td>−{money(s.totals.expenses)}</td>
                <td>−{money(s.totals.turnoverCosts)}</td>
                <td>{money(s.totals.netPayout)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-xs text-muted">Prepared with Manage Homestay · Appa Technologies Pty Ltd</p>
        </Card>
      )}
    </div>
  );
}

// ───────────────────────── Guest messages ─────────────────────────

type Template = { id: string; name: string; subject: string; body: string };
type Message = { id: string; recipient: string; subject: string; body: string; status: string; error: string | null; createdAt: string };

export function Messages() {
  const qc = useQueryClient();
  const templates = useQuery({ queryKey: ["str", "templates"], queryFn: () => api.get<{ data: Template[] }>("/api/str/templates") });
  const bookings = useQuery({
    queryKey: ["str", "bookings", "msg"],
    queryFn: () => api.get<{ data: Booking[] }>("/api/str/bookings", { from: todayIso() }),
  });
  const messages = useQuery({ queryKey: ["str", "messages"], queryFn: () => api.get<{ data: Message[] }>("/api/str/messages") });
  const [templateId, setTemplateId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [draft, setDraft] = useState<{ subject: string; body: string; recipient: string | null } | null>(null);
  const tf = useForm({ name: "", subject: "", body: "" });

  const preview = useMutation({
    mutationFn: () => api.post<{ data: { subject: string; body: string; recipient: string | null } }>("/api/str/messages/preview", { templateId, bookingId }),
    onSuccess: (r) => setDraft(r.data),
    onError: onErr,
  });
  const saveDraft = useMutation({
    mutationFn: () =>
      api.post<{ data: Message }>("/api/str/messages", {
        templateId,
        bookingId,
        subject: draft?.subject,
        body: draft?.body,
        recipient: draft?.recipient || undefined,
      }),
    onSuccess: () => {
      toast.success("Draft saved — review it below, then send");
      setDraft(null);
      invalidate(qc);
    },
    onError: onErr,
  });
  const send = useMutation({
    mutationFn: (id: string) => api.post(`/api/str/messages/${id}/send`),
    onSuccess: () => toast.success("Sent"),
    onError: onErr,
    onSettled: () => invalidate(qc),
  });
  const addTemplate = useMutation({
    mutationFn: () => api.post("/api/str/templates", tf.values),
    onSuccess: () => {
      tf.reset();
      invalidate(qc);
    },
    onError: onErr,
  });

  const stayOpts = (bookings.data?.data ?? [])
    .filter((b) => b.status === "confirmed")
    .map((b) => ({
      value: b.id,
      label: `${b.listing?.name ?? ""} ${b.checkIn} → ${b.checkOut} · ${b.guest ? b.guest.firstName : sourceLabel(b.source)}`,
    }));

  return (
    <div>
      <PageHeader title="Guest messages" subtitle="Preview → save draft → send. Nothing is emailed until you press Send." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">Compose</h2>
          <div className="space-y-3">
            <Select options={(templates.data?.data ?? []).map((t) => ({ value: t.id, label: t.name }))} placeholder="Template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} />
            <Select options={stayOpts} placeholder="Upcoming stay" value={bookingId} onChange={(e) => setBookingId(e.target.value)} />
            <Button variant="secondary" disabled={!templateId || !bookingId} loading={preview.isPending} onClick={() => preview.mutate()}>
              <Eye className="h-4 w-4" /> Preview
            </Button>
            {draft && (
              <div className="space-y-2 rounded-xl border border-line p-3">
                <Label>To</Label>
                <Input value={draft.recipient ?? ""} placeholder="guest email" onChange={(e) => setDraft({ ...draft, recipient: e.target.value })} />
                <Label>Subject</Label>
                <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
                <Label>Body</Label>
                <Textarea className="min-h-56" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
                <Button variant="signal" loading={saveDraft.isPending} onClick={() => saveDraft.mutate()}>
                  Save draft
                </Button>
              </div>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">Templates</h2>
          <ul className="mb-4 space-y-1 text-sm">
            {templates.data?.data.map((t) => (
              <li key={t.id}>
                <span className="font-semibold">{t.name}</span> — <span className="text-muted">{t.subject}</span>
              </li>
            ))}
          </ul>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              addTemplate.mutate();
            }}
          >
            <Input placeholder="Template name" required {...tf.bind("name")} />
            <Input placeholder="Subject, e.g. Your stay at {{listing_name}}" required {...tf.bind("subject")} />
            <Textarea
              placeholder="Body. Placeholders: {{guest_name}} {{listing_name}} {{check_in}} {{check_out}} {{nights}} {{check_in_time}} {{check_out_time}} {{address}} {{house_rules}} {{check_in_instructions}}"
              required
              {...tf.bind("body")}
            />
            <Button type="submit" variant="secondary" loading={addTemplate.isPending}>
              <Plus className="h-4 w-4" /> Add template
            </Button>
          </form>
        </Card>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Drafts & sent</h2>
      <Card padding="none">
        {messages.data?.data.map((m) => (
          <details key={m.id} className="border-t border-line p-3 first:border-0">
            <summary className="flex cursor-pointer items-center gap-2 text-sm">
              <Badge variant={m.status === "sent" ? "success" : m.status === "failed" ? "danger" : "warning"}>{m.status}</Badge>
              <span className="font-semibold">{m.subject}</span>
              <span className="text-muted">→ {m.recipient}</span>
              {m.status !== "sent" && (
                <Button
                  size="sm"
                  variant="signal"
                  className="ml-auto"
                  loading={send.isPending && send.variables === m.id}
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm(`Send to ${m.recipient}?`)) send.mutate(m.id);
                  }}
                >
                  <Send className="h-3 w-3" /> Send
                </Button>
              )}
            </summary>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-muted">{m.body}</pre>
            {m.error && <p className="text-xs text-red-600">{m.error}</p>}
          </details>
        ))}
        {messages.data?.data.length === 0 && <p className="p-6 text-center text-muted">No messages yet.</p>}
      </Card>
    </div>
  );
}
