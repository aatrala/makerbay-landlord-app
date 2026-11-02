import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  pgEnum,
  uuid,
  jsonb,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ── Enums ──

export const propertyTypeEnum = pgEnum("property_type", [
  "single_family",
  "duplex",
  "multifamily",
  "condo",
  "townhouse",
]);

export const propertyStatusEnum = pgEnum("property_status", [
  "active",
  "vacant",
  "under_renovation",
]);

export const unitStatusEnum = pgEnum("unit_status", [
  "occupied",
  "vacant",
  "under_renovation",
]);

export const leaseStatusEnum = pgEnum("lease_status", [
  "active",
  "expired",
  "terminated",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "check",
  "zelle",
  "venmo",
  "ach",
  "card",
  "bank_transfer",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "received",
  "late",
  "partial",
]);

export const maintenancePriorityEnum = pgEnum("maintenance_priority", [
  "emergency",
  "urgent",
  "routine",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "submitted",
  "acknowledged",
  "in_progress",
  "completed",
]);

export const expenseCategoryEnum = pgEnum("expense_category", [
  "advertising",
  "auto_travel",
  "cleaning",
  "insurance",
  "legal_professional",
  "management",
  "mortgage_interest",
  "other_interest",
  "repairs",
  "supplies",
  "taxes",
  "utilities",
  "depreciation",
  "other",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "lease_renewal",
  "rent_reminder",
  "late_rent",
  "maintenance_update",
  "rent_increase",
  "inspection",
  "custom",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "sms",
  "in_app",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

export const planTierEnum = pgEnum("plan_tier", [
  "starter",
  "growth",
  "pro",
  "portfolio",
]);

export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "annual",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "cancelled",
]);

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "monthly",
  "quarterly",
  "annually",
]);

// ── Users (Better-Auth managed) ──

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Properties ──

export const property = pgTable("property", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  type: propertyTypeEnum("type").notNull(),
  unitCount: integer("unit_count").notNull().default(1),
  status: propertyStatusEnum("status").notNull().default("active"),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Units ──

export const unit = pgTable("unit", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => property.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  rentAmount: real("rent_amount").notNull(),
  status: unitStatusEnum("status").notNull().default("vacant"),
  bedrooms: integer("bedrooms"),
  bathrooms: real("bathrooms"),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Tenants ──

export const tenant = pgTable("tenant", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Links this tenant record to the tenant's own login account (nullable until they activate)
  tenantUserId: text("tenant_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  employer: text("employer"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Leases ──

export const lease = pgTable("lease", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => unit.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  rentAmount: real("rent_amount").notNull(),
  deposit: real("deposit"),
  terms: text("terms"),
  documentUrl: text("document_url"),
  status: leaseStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Payments ──

export const payment = pgTable("payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => unit.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  amountPaid: real("amount_paid").notNull().default(0),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  method: paymentMethodEnum("method"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  lateFee: real("late_fee").notNull().default(0),
  notes: text("notes"),
  matchedTransactionId: text("matched_transaction_id"),
  // Stripe online payment fields
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeClientSecret: text("stripe_client_secret"),
  stripePaymentMethod: text("stripe_payment_method"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Maintenance Requests ──

export const maintenanceRequest = pgTable("maintenance_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => unit.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").references(() => tenant.id, {
    onDelete: "set null",
  }),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => property.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: maintenancePriorityEnum("priority")
    .notNull()
    .default("routine"),
  status: maintenanceStatusEnum("status")
    .notNull()
    .default("submitted"),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  completionPhotos: jsonb("completion_photos")
    .$type<string[]>()
    .notNull()
    .default([]),
  vendorId: uuid("vendor_id").references(() => vendor.id, {
    onDelete: "set null",
  }),
  cost: real("cost"),
  // AI triage fields
  aiCategory: text("ai_category"),
  aiPriority: text("ai_priority"),
  aiConfidence: real("ai_confidence"),
  aiEstimatedCost: real("ai_estimated_cost"),
  aiRecommendedVendorId: uuid("ai_recommended_vendor_id").references(() => vendor.id, {
    onDelete: "set null",
  }),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Expenses ──

export const expense = pgTable("expense", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => property.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id").references(() => unit.id, {
    onDelete: "set null",
  }),
  category: expenseCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  date: date("date").notNull(),
  vendor: text("vendor"),
  receiptUrl: text("receipt_url"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringFrequency: recurringFrequencyEnum("recurring_frequency"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Vendors ──

export const vendor = pgTable("vendor", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  trade: text("trade").notNull(),
  phone: text("phone"),
  email: text("email"),
  insuranceExpiry: date("insurance_expiry"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Notifications ──

export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  status: notificationStatusEnum("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Subscriptions ──

export const subscription = pgTable("subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: planTierEnum("plan").notNull().default("starter"),
  billingCycle: billingCycleEnum("billing_cycle")
    .notNull()
    .default("monthly"),
  status: subscriptionStatusEnum("status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// Short-term rentals (STR)
// ════════════════════════════════════════════════════════════════════

export const bookingSourceEnum = pgEnum("booking_source", [
  "direct",
  "airbnb",
  "booking_com",
  "vrbo",
  "other",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "tentative",
  "confirmed",
  "blocked",
  "cancelled",
]);

export const turnoverStatusEnum = pgEnum("turnover_status", [
  "pending",
  "assigned",
  "in_progress",
  "done",
  "cancelled",
]);

export const guestMessageStatusEnum = pgEnum("guest_message_status", [
  "draft",
  "sent",
  "failed",
]);

// ── Homeowners (owners of homes you manage, for owner statements) ──

export const homeowner = pgTable("homeowner", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  // Default management fee (% of accommodation revenue) for this owner's listings
  managementFeePct: real("management_fee_pct").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Listings (an STR configuration on top of an existing unit) ──

export const listing = pgTable(
  "listing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => property.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => unit.id, { onDelete: "cascade" }),
    homeownerId: uuid("homeowner_id").references(() => homeowner.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    nightlyRate: real("nightly_rate").notNull(),
    minStay: integer("min_stay").notNull().default(1),
    cleaningFee: real("cleaning_fee").notNull().default(0),
    maxGuests: integer("max_guests"),
    houseRules: text("house_rules"),
    checkInTime: text("check_in_time").notNull().default("15:00"),
    checkOutTime: text("check_out_time").notNull().default("10:00"),
    checkInInstructions: text("check_in_instructions"),
    // Overrides homeowner.managementFeePct when set
    managementFeePct: real("management_fee_pct"),
    // Secret token for the public .ics export URL
    icalToken: text("ical_token").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("listing_unit_unique").on(t.unitId),
    uniqueIndex("listing_ical_token_unique").on(t.icalToken),
  ],
);

// ── Guests ──

export const guest = pgTable("guest", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── iCal feeds to import (Airbnb / Booking.com / VRBO) ──

export const calendarFeed = pgTable("calendar_feed", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listing.id, { onDelete: "cascade" }),
  source: bookingSourceEnum("source").notNull(),
  url: text("url").notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  lastStatus: text("last_status"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Bookings / reservations / blocks ──

export const booking = pgTable(
  "booking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").references(() => guest.id, { onDelete: "set null" }),
    calendarFeedId: uuid("calendar_feed_id").references(() => calendarFeed.id, {
      onDelete: "set null",
    }),
    source: bookingSourceEnum("source").notNull().default("direct"),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
    // [checkIn, checkOut) — checkout day is free for the next arrival
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    numGuests: integer("num_guests"),
    accommodationTotal: real("accommodation_total").notNull().default(0),
    cleaningFee: real("cleaning_fee").notNull().default(0),
    // Channel commission / payment processing fees
    platformFee: real("platform_fee").notNull().default(0),
    taxes: real("taxes").notNull().default(0),
    externalUid: text("external_uid"),
    summary: text("summary"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("booking_listing_uid_unique").on(t.listingId, t.externalUid),
    index("booking_listing_dates_idx").on(t.listingId, t.checkIn, t.checkOut),
  ],
);

// ── Cleaning / turnover tasks (auto-created per checkout) ──

export const turnoverTask = pgTable(
  "turnover_task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => booking.id, {
      onDelete: "cascade",
    }),
    vendorId: uuid("vendor_id").references(() => vendor.id, { onDelete: "set null" }),
    dueDate: date("due_date").notNull(),
    // Next arrival on the same day, if any (tight turnover)
    nextCheckIn: date("next_check_in"),
    status: turnoverStatusEnum("status").notNull().default("pending"),
    cost: real("cost"),
    notes: text("notes"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("turnover_booking_unique").on(t.bookingId)],
);

// ── Guest message templates & sent messages ──

export const messageTemplate = pgTable("message_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  // Supports {{guest_name}}, {{listing_name}}, {{check_in}}, {{check_out}},
  // {{check_in_time}}, {{check_out_time}}, {{address}}, {{house_rules}},
  // {{check_in_instructions}}, {{nights}}
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const guestMessage = pgTable("guest_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  bookingId: uuid("booking_id").references(() => booking.id, { onDelete: "set null" }),
  templateId: uuid("template_id").references(() => messageTemplate.id, {
    onDelete: "set null",
  }),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: guestMessageStatusEnum("status").notNull().default("draft"),
  error: text("error"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
