import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test_placeholder");

const FROM_EMAIL = "RentLite <noreply@rentlite.app>";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      console.error("[Resend] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Resend] Exception:", err);
    return { success: false, error: String(err) };
  }
}

// ── Email Templates ──

export function rentReminderEmail(params: {
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  dueDate: string;
}): string {
  return `
    <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f172a; font-size: 24px;">Rent Reminder</h2>
      <p style="color: #64748b;">Hi ${params.tenantName},</p>
      <p style="color: #334155;">
        This is a friendly reminder that your rent of
        <strong>$${params.amount.toLocaleString()}</strong> for
        <strong>${params.propertyName} – Unit ${params.unitNumber}</strong>
        is due on <strong>${params.dueDate}</strong>.
      </p>
      <p style="color: #64748b; font-size: 14px;">
        If you've already paid, please disregard this message.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Sent via RentLite</p>
    </div>
  `;
}

export function rentReceiptEmail(params: {
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  paidDate: string;
  method: string;
}): string {
  return `
    <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f172a; font-size: 24px;">Rent Receipt</h2>
      <p style="color: #64748b;">Hi ${params.tenantName},</p>
      <p style="color: #334155;">
        Your rent payment has been received:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; color: #64748b;">Property</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${params.propertyName}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Unit</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${params.unitNumber}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Amount</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">$${params.amount.toLocaleString()}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Date Paid</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${params.paidDate}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Method</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${params.method}</td></tr>
      </table>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Sent via RentLite</p>
    </div>
  `;
}

export function maintenanceUpdateEmail(params: {
  tenantName: string;
  propertyName: string;
  requestTitle: string;
  status: string;
}): string {
  const statusLabels: Record<string, string> = {
    acknowledged: "acknowledged and being reviewed",
    in_progress: "currently being worked on",
    completed: "completed",
  };
  return `
    <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f172a; font-size: 24px;">Maintenance Update</h2>
      <p style="color: #64748b;">Hi ${params.tenantName},</p>
      <p style="color: #334155;">
        Your maintenance request "<strong>${params.requestTitle}</strong>"
        at <strong>${params.propertyName}</strong> has been
        <strong>${statusLabels[params.status] || params.status}</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Sent via RentLite</p>
    </div>
  `;
}
