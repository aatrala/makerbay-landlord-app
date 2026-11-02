export type TemplateContext = Record<string, string | number | null | undefined>;

/** Replace {{placeholders}}; unknown placeholders are left visible for review. */
export function renderTemplate(tpl: string, ctx: TemplateContext): string {
  return tpl.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, key: string) => {
    const v = ctx[key.toLowerCase()];
    return v === undefined || v === null ? m : String(v);
  });
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function textToHtml(s: string): string {
  return `<div style="font-family:sans-serif;line-height:1.5">${escapeHtml(s).replace(/\n/g, "<br>")}</div>`;
}

export const DEFAULT_CHECKIN_TEMPLATE = {
  name: "Check-in instructions",
  subject: "Your stay at {{listing_name}} – check-in details",
  body: `Hi {{guest_name}},

We're looking forward to hosting you at {{listing_name}} from {{check_in}} to {{check_out}} ({{nights}} nights).

Address: {{address}}
Check-in from {{check_in_time}}, check-out by {{check_out_time}}.

{{check_in_instructions}}

House rules:
{{house_rules}}

See you soon!
Manage Homestay`,
};
