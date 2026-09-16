import { db } from "./index.js";
import { hashPassword } from "better-auth/crypto";
import {
  user,
  account,
  property,
  unit,
  tenant,
  lease,
  payment,
  maintenanceRequest,
  expense,
  vendor,
} from "./schema.js";

// Demo credentials: landlord@rentlite.dev / demo1234, tenant@rentlite.dev / demo1234

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  console.log("[RentLite] Seeding demo data...");

  const existing = await db.select().from(user);
  if (existing.length > 0) {
    console.log("[RentLite] Database already has users, skipping seed.");
    return;
  }

  const passwordHash = await hashPassword("demo1234");

  const credential = (userId: string) => ({
    id: `demo-account-${userId}`,
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });

  const [landlord] = await db
    .insert(user)
    .values({
      id: "demo-landlord-001",
      name: "Sarah Mitchell",
      email: "landlord@rentlite.dev",
      emailVerified: true,
    })
    .returning();

  const [tenantUser] = await db
    .insert(user)
    .values({
      id: "demo-tenant-001",
      name: "Marcus Chen",
      email: "tenant@rentlite.dev",
      emailVerified: true,
    })
    .returning();

  await db.insert(account).values([
    credential(landlord.id),
    credential(tenantUser.id),
  ]);

  const extraUsers = await db
    .insert(user).values([
    {
      id: "demo-tenant-002",
      name: "Elena Rodriguez",
      email: "elena.rodriguez@example.com",
      emailVerified: true,
    },
    {
      id: "demo-tenant-003",
      name: "David Park",
      email: "david.park@example.com",
      emailVerified: true,
    },
  ]);

  const [oakwood] = await db
    .insert(property)
    .values({
      userId: landlord.id,
      name: "Oakwood Court",
      address: "421 Oakwood Court",
      city: "Austin",
      state: "TX",
      zip: "78701",
      type: "duplex",
      unitCount: 2,
      status: "active",
      notes: "Charming duplex near downtown, built 2015.",
    })
    .returning();

  const [maplewood] = await db
    .insert(property)
    .values({
      userId: landlord.id,
      name: "Maplewood House",
      address: "1187 Maplewood Drive",
      city: "Austin",
      state: "TX",
      zip: "78703",
      type: "single_family",
      unitCount: 1,
      status: "active",
    })
    .returning();

  const [cedarRidge] = await db
    .insert(property)
    .values({
      userId: landlord.id,
      name: "Cedar Ridge Condo",
      address: "88 Cedar Ridge Lane, Unit 12",
      city: "Austin",
      state: "TX",
      zip: "78745",
      type: "condo",
      unitCount: 1,
      status: "vacant",
    })
    .returning();

  const units = await db
    .insert(unit)
    .values([
      { propertyId: oakwood.id, unitNumber: "A", rentAmount: 1850, status: "occupied", bedrooms: 2, bathrooms: 1 },
      { propertyId: oakwood.id, unitNumber: "B", rentAmount: 1950, status: "occupied", bedrooms: 2, bathrooms: 1.5 },
      { propertyId: maplewood.id, unitNumber: "Main", rentAmount: 2600, status: "occupied", bedrooms: 3, bathrooms: 2 },
      { propertyId: cedarRidge.id, unitNumber: "12", rentAmount: 1450, status: "vacant", bedrooms: 1, bathrooms: 1 },
    ])
    .returning();

  const [unitA, unitB, unitMain, unit12] = units;

  const tenants = await db
    .insert(tenant)
    .values([
      {
        userId: landlord.id,
        tenantUserId: tenantUser.id,
        firstName: "Marcus",
        lastName: "Chen",
        email: "tenant@rentlite.dev",
        phone: "512-555-0142",
        employer: "Dell Technologies",
      },
      {
        userId: landlord.id,
        firstName: "Elena",
        lastName: "Rodriguez",
        email: "elena.rodriguez@example.com",
        phone: "512-555-0198",
        employer: "St. David's Healthcare",
      },
      {
        userId: landlord.id,
        firstName: "David",
        lastName: "Park",
        email: "david.park@example.com",
        phone: "512-555-0176",
        employer: "National Instruments",
      },
    ])
    .returning();

  const [marcus, elena, david] = tenants;

  await db.insert(lease).values([
    {
      unitId: unitA.id,
      tenantId: marcus.id,
      startDate: dateOffset(-330),
      endDate: dateOffset(35),
      rentAmount: 1850,
      deposit: 1850,
      terms: "12-month lease. Rent due on the 1st. No smoking. Pets allowed with deposit.",
      status: "active",
    },
    {
      unitId: unitB.id,
      tenantId: elena.id,
      startDate: dateOffset(-120),
      endDate: dateOffset(245),
      rentAmount: 1950,
      deposit: 1950,
      terms: "12-month lease. Rent due on the 1st.",
      status: "active",
    },
    {
      unitId: unitMain.id,
      tenantId: david.id,
      startDate: dateOffset(-700),
      endDate: dateOffset(30),
      rentAmount: 2600,
      deposit: 2600,
      terms: "24-month lease. Rent due on the 5th.",
      status: "active",
    },
  ]);

  await db.insert(payment).values([
    // Current month charges
    { unitId: unitA.id, tenantId: marcus.id, amount: 1850, dueDate: dateOffset(-5), status: "pending" },
    { unitId: unitB.id, tenantId: elena.id, amount: 1950, dueDate: dateOffset(-5), status: "pending" },
    { unitId: unitMain.id, tenantId: david.id, amount: 2600, dueDate: dateOffset(-5), status: "pending" },
    // Last month — mostly paid, one late
    { unitId: unitA.id, tenantId: marcus.id, amount: 1850, amountPaid: 1850, dueDate: dateOffset(-35), paidDate: dateOffset(-36), method: "ach", status: "received" },
    { unitId: unitB.id, tenantId: elena.id, amount: 1950, amountPaid: 1950, dueDate: dateOffset(-35), paidDate: dateOffset(-33), method: "zelle", status: "received" },
    { unitId: unitMain.id, tenantId: david.id, amount: 2600, amountPaid: 2600, dueDate: dateOffset(-35), paidDate: dateOffset(-40), method: "check", status: "received", lateFee: 75 },
    // Two months ago
    { unitId: unitA.id, tenantId: marcus.id, amount: 1850, amountPaid: 1850, dueDate: dateOffset(-65), paidDate: dateOffset(-66), method: "ach", status: "received" },
    { unitId: unitB.id, tenantId: elena.id, amount: 1950, amountPaid: 1950, dueDate: dateOffset(-65), paidDate: dateOffset(-64), method: "zelle", status: "received" },
    { unitId: unitMain.id, tenantId: david.id, amount: 2600, amountPaid: 2600, dueDate: dateOffset(-65), paidDate: dateOffset(-63), method: "check", status: "received" },
  ]);

  const [plumbing, hvacVendor] = await db
    .insert(vendor)
    .values([
      {
        userId: landlord.id,
        name: "Capital City Plumbing",
        trade: "plumbing",
        phone: "512-555-0110",
        email: "dispatch@capitalcityplumbing.example.com",
        insuranceExpiry: dateOffset(200),
      },
      {
        userId: landlord.id,
        name: "Lone Star HVAC",
        trade: "hvac",
        phone: "512-555-0185",
        email: "service@lonestarhvac.example.com",
        insuranceExpiry: dateOffset(90),
      },
      {
        userId: landlord.id,
        name: "Hill Country Electric",
        trade: "electrical",
        phone: "512-555-0133",
        email: "jobs@hillcountryelectric.example.com",
        insuranceExpiry: dateOffset(320),
      },
    ])
    .returning();

  await db.insert(maintenanceRequest).values([
    {
      unitId: unitA.id,
      propertyId: oakwood.id,
      tenantId: marcus.id,
      title: "Kitchen faucet dripping constantly",
      description:
        "The kitchen faucet drips even when fully closed. Started a few days ago and it is getting worse. Getting a puddle in the sink.",
      priority: "routine",
      status: "acknowledged",
      aiCategory: "plumbing",
      aiPriority: "routine",
      aiConfidence: 0.94,
      aiEstimatedCost: 120,
      aiRecommendedVendorId: plumbing.id,
      submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
    {
      unitId: unitMain.id,
      propertyId: maplewood.id,
      tenantId: david.id,
      title: "AC not cooling below 78F",
      description:
        "The air conditioning runs constantly but cannot get the house below 78 degrees. Filter was replaced last month. It is very hot in the afternoons.",
      priority: "urgent",
      status: "in_progress",
      vendorId: hvacVendor.id,
      cost: 350,
      aiCategory: "hvac",
      aiPriority: "urgent",
      aiConfidence: 0.97,
      aiEstimatedCost: 300,
      aiRecommendedVendorId: hvacVendor.id,
      submittedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    },
    {
      unitId: unitB.id,
      propertyId: oakwood.id,
      tenantId: elena.id,
      title: "Bedroom outlet sparking",
      description:
        "Saw a small spark when plugging in a lamp in the master bedroom. Outlet works but scared to use it now.",
      priority: "emergency",
      status: "submitted",
      aiCategory: "electrical",
      aiPriority: "emergency",
      aiConfidence: 0.99,
      aiEstimatedCost: 180,
      aiRecommendedVendorId: null,
      submittedAt: new Date(Date.now() - 12 * 3600 * 1000),
    },
    {
      unitId: unitA.id,
      propertyId: oakwood.id,
      tenantId: marcus.id,
      title: "Garbage disposal jammed",
      description:
        "Disposal hums but does not grind. Already tried the reset button.",
      priority: "routine",
      status: "completed",
      vendorId: plumbing.id,
      cost: 95,
      completedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
      submittedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000),
    },
  ]);

  await db.insert(expense).values([
    { propertyId: oakwood.id, category: "repairs", description: "Garbage disposal replacement (Unit A)", amount: 95, date: dateOffset(-20), vendor: "Capital City Plumbing" },
    { propertyId: oakwood.id, category: "insurance", description: "Landlord policy premium", amount: 1450, date: dateOffset(-45), isRecurring: true, recurringFrequency: "annually" },
    { propertyId: maplewood.id, category: "repairs", description: "AC diagnostic visit", amount: 85, date: dateOffset(-4), vendor: "Lone Star HVAC" },
    { propertyId: maplewood.id, category: "mortgage_interest", description: "Mortgage interest (July)", amount: 1180, date: dateOffset(-32), isRecurring: true, recurringFrequency: "monthly" },
    { propertyId: cedarRidge.id, category: "advertising", description: "Zillow listing for vacant unit", amount: 60, date: dateOffset(-10) },
    { propertyId: oakwood.id, category: "utilities", description: "Water for common areas", amount: 78, date: dateOffset(-15), isRecurring: true, recurringFrequency: "monthly" },
  ]);

  console.log("[RentLite] Seed complete.");
  console.log("  Landlord login: landlord@rentlite.dev / demo1234");
  console.log("  Tenant portal:  tenant@rentlite.dev / demo1234");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[RentLite] Seed failed:", err);
    process.exit(1);
  });
