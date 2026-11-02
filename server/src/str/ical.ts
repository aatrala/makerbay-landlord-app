/**
 * Minimal RFC 5545 support for channel-manager style availability feeds
 * (Airbnb, Booking.com, VRBO). Only VEVENT date ranges matter here.
 */

export type IcalEvent = {
  uid: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD (exclusive)
  summary?: string;
  description?: string;
  status?: string;
};

function unfold(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

function unescapeText(v: string): string {
  return v.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
}

/** Accepts 20260101, 20260101T150000Z, 20260101T150000 → 2026-01-01 */
export function parseIcalDate(v: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(v.trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function parseIcal(text: string): IcalEvent[] {
  const events: IcalEvent[] = [];
  let cur: Partial<IcalEvent> | null = null;
  let idx = 0;
  for (const raw of unfold(text)) {
    const line = raw.trimEnd();
    if (!line) continue;
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && cur.start) {
        let end = cur.end;
        if (!end || end <= cur.start) {
          // All-day event with no DTEND lasts one day
          const d = new Date(`${cur.start}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + 1);
          end = d.toISOString().slice(0, 10);
        }
        events.push({
          uid: cur.uid || `generated-${cur.start}-${end}-${idx++}`,
          start: cur.start,
          end,
          summary: cur.summary,
          description: cur.description,
          status: cur.status,
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const name = line.slice(0, colon).split(";")[0].toUpperCase();
    const value = line.slice(colon + 1);
    switch (name) {
      case "UID":
        cur.uid = value.trim();
        break;
      case "DTSTART":
        cur.start = parseIcalDate(value) ?? undefined;
        break;
      case "DTEND":
        cur.end = parseIcalDate(value) ?? undefined;
        break;
      case "SUMMARY":
        cur.summary = unescapeText(value);
        break;
      case "DESCRIPTION":
        cur.description = unescapeText(value);
        break;
      case "STATUS":
        cur.status = value.trim().toUpperCase();
        break;
    }
  }
  return events;
}

/** Classify an imported event: real reservation vs owner/platform block. */
export function classifyEvent(e: IcalEvent): "confirmed" | "blocked" | "cancelled" {
  if (e.status === "CANCELLED") return "cancelled";
  const s = (e.summary || "").toLowerCase();
  if (/not available|blocked|closed|unavailable/.test(s)) return "blocked";
  return "confirmed";
}

function escapeText(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold content lines at 75 octets per RFC 5545 §3.1. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let chunk = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(chunk);
      chunk = "";
      size = 0;
    }
    chunk += ch;
    size += n;
  }
  out.push(chunk);
  return out.join("\r\n ");
}

const compact = (d: string) => d.replace(/-/g, "");

export function buildIcal(opts: {
  calendarName: string;
  events: { uid: string; start: string; end: string; summary: string }[];
  now?: Date;
}): string {
  const stamp = (opts.now ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Manage Homestay//Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.calendarName)}`,
  ];
  for (const e of opts.events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.start)}`,
      `DTEND;VALUE=DATE:${compact(e.end)}`,
      `SUMMARY:${escapeText(e.summary)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
