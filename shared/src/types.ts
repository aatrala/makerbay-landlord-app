// ── Property & Unit Types ──

export type PropertyType = "single_family" | "duplex" | "multifamily" | "condo" | "townhouse";
export type PropertyStatus = "active" | "vacant" | "under_renovation";
export type UnitStatus = "occupied" | "vacant" | "under_renovation";

export interface Property {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: PropertyType;
  unitCount: number;
  status: PropertyStatus;
  photos: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  rentAmount: number;
  status: UnitStatus;
  bedrooms: number | null;
  bathrooms: number | null;
  photos: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Tenant & Lease Types ──

export interface Tenant {
  id: string;
  userId: string;
  tenantUserId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  employer: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  deposit: number | null;
  terms: string | null;
  documentUrl: string | null;
  status: "active" | "expired" | "terminated";
  createdAt: string;
  updatedAt: string;
}

// ── Payment Types ──

export type PaymentMethod = "cash" | "check" | "zelle" | "venmo" | "ach" | "card" | "bank_transfer" | "other";
export type PaymentStatus = "pending" | "received" | "late" | "partial";

export interface Payment {
  id: string;
  unitId: string;
  tenantId: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  paidDate: string | null;
  method: PaymentMethod | null;
  status: PaymentStatus;
  lateFee: number;
  notes: string | null;
  matchedTransactionId: string | null;
  // Stripe online payment fields
  stripePaymentIntentId: string | null;
  stripeClientSecret: string | null;
  stripePaymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Maintenance Types ──

export type MaintenancePriority = "emergency" | "urgent" | "routine";
export type MaintenanceStatus = "submitted" | "acknowledged" | "in_progress" | "completed";

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  tenantId: string | null;
  propertyId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  photos: string[];
  completionPhotos: string[];
  vendorId: string | null;
  cost: number | null;
  // AI triage fields
  aiCategory: string | null;
  aiPriority: string | null;
  aiConfidence: number | null;
  aiEstimatedCost: number | null;
  aiRecommendedVendorId: string | null;
  submittedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Expense Types ──

export type ExpenseCategory =
  | "advertising"
  | "auto_travel"
  | "cleaning"
  | "insurance"
  | "legal_professional"
  | "management"
  | "mortgage_interest"
  | "other_interest"
  | "repairs"
  | "supplies"
  | "taxes"
  | "utilities"
  | "depreciation"
  | "other";

export interface Expense {
  id: string;
  propertyId: string;
  unitId: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  vendor: string | null;
  receiptUrl: string | null;
  isRecurring: boolean;
  recurringFrequency: "monthly" | "quarterly" | "annually" | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Vendor Types ──

export interface Vendor {
  id: string;
  userId: string;
  name: string;
  trade: string;
  phone: string | null;
  email: string | null;
  insuranceExpiry: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Notification Types ──

export type NotificationType =
  | "lease_renewal"
  | "rent_reminder"
  | "late_rent"
  | "maintenance_update"
  | "rent_increase"
  | "inspection"
  | "custom";
export type NotificationChannel = "email" | "sms" | "in_app";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  body: string;
  status: "pending" | "sent" | "failed";
  scheduledAt: string;
  sentAt: string | null;
  createdAt: string;
}

// ── Subscription Types ──

export type PlanTier = "starter" | "growth" | "pro" | "portfolio";
export type BillingCycle = "monthly" | "annual";

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanTier;
  billingCycle: BillingCycle;
  status: "active" | "trialing" | "past_due" | "cancelled";
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Dashboard / Report Types ──

export interface CashFlowEntry {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface PropertyReport {
  propertyId: string;
  propertyName: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate: number;
  collectionRate: number;
}

export interface ScheduleEEntry {
  category: ExpenseCategory;
  line: number;
  description: string;
  amount: number;
}

// ── API Response Types ──

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
