import { relations } from "drizzle-orm";
import {
  user,
  session,
  account,
  property,
  unit,
  tenant,
  lease,
  payment,
  maintenanceRequest,
  expense,
  vendor,
  notification,
  subscription,
} from "./schema.js";

// ── User Relations ──
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  properties: many(property),
  // Landlord-owned tenant records
  tenants: many(tenant),
  // Vendor records owned by this user
  vendors: many(vendor),
  notifications: many(notification),
  subscriptions: many(subscription),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

// ── Property Relations ──
export const propertyRelations = relations(property, ({ one, many }) => ({
  user: one(user, { fields: [property.userId], references: [user.id] }),
  units: many(unit),
  expenses: many(expense),
  maintenanceRequests: many(maintenanceRequest),
}));

// ── Unit Relations ──
export const unitRelations = relations(unit, ({ one, many }) => ({
  property: one(property, { fields: [unit.propertyId], references: [property.id] }),
  leases: many(lease),
  payments: many(payment),
  maintenanceRequests: many(maintenanceRequest),
  expenses: many(expense),
}));

// ── Tenant Relations ──
export const tenantRelations = relations(tenant, ({ one, many }) => ({
  user: one(user, { fields: [tenant.userId], references: [user.id], relationName: "tenantOwner" }),
  tenantUser: one(user, { fields: [tenant.tenantUserId], references: [user.id], relationName: "tenantLogin" }),
  leases: many(lease),
  payments: many(payment),
  maintenanceRequests: many(maintenanceRequest),
}));

// ── Lease Relations ──
export const leaseRelations = relations(lease, ({ one }) => ({
  unit: one(unit, { fields: [lease.unitId], references: [unit.id] }),
  tenant: one(tenant, { fields: [lease.tenantId], references: [tenant.id] }),
}));

// ── Payment Relations ──
export const paymentRelations = relations(payment, ({ one }) => ({
  unit: one(unit, { fields: [payment.unitId], references: [unit.id] }),
  tenant: one(tenant, { fields: [payment.tenantId], references: [tenant.id] }),
}));

// ── Maintenance Relations ──
export const maintenanceRequestRelations = relations(maintenanceRequest, ({ one }) => ({
  unit: one(unit, { fields: [maintenanceRequest.unitId], references: [unit.id] }),
  tenant: one(tenant, { fields: [maintenanceRequest.tenantId], references: [tenant.id] }),
  property: one(property, { fields: [maintenanceRequest.propertyId], references: [property.id] }),
  vendor: one(vendor, { fields: [maintenanceRequest.vendorId], references: [vendor.id], relationName: "assignedVendor" }),
  aiRecommendedVendor: one(vendor, { fields: [maintenanceRequest.aiRecommendedVendorId], references: [vendor.id], relationName: "aiVendor" }),
}));

// ── Expense Relations ──
export const expenseRelations = relations(expense, ({ one }) => ({
  property: one(property, { fields: [expense.propertyId], references: [property.id] }),
  unit: one(unit, { fields: [expense.unitId], references: [unit.id] }),
}));

// ── Vendor Relations ──
export const vendorRelations = relations(vendor, ({ one, many }) => ({
  user: one(user, { fields: [vendor.userId], references: [user.id] }),
  maintenanceRequests: many(maintenanceRequest),
}));

// ── Notification Relations ──
export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

// ── Subscription Relations ──
export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, { fields: [subscription.userId], references: [user.id] }),
}));
