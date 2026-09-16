---
document_type: Product Specification Sheet
version: 1.0
date: September 11, 2026
status: Draft
author: Product Team
confidentiality: Internal
---

# Product Spec Sheet: Small Landlord Property Management SaaS

---

## 1. Product Overview

| Attribute | Detail |
|---|---|
| **Product Name** | **RentLite** (working title) |
| **Positioning Statement** | The embarrassingly simple property management tool for landlords with 2-20 units. |
| **Target User** | Individual small landlords managing 2-20 residential rental units who currently rely on spreadsheets, text messages, and email to run their rental business. |
| **Market Size** | 10+ million small landlords in the US alone (Census Bureau / NAR estimates). |
| **Core Value Proposition** | All-in-one rent tracking, maintenance coordination, expense management, and tax-time reporting -- designed from the ground up for landlords who do not need enterprise software. |

### Target User Persona

| Dimension | Detail |
|---|---|
| **Age** | 35-65 |
| **Occupation** | Full-time job (W-2) + rental income on the side, or retired/semi-retired |
| **Tech Comfort** | Moderate -- uses smartphone daily, comfortable with banking apps, not a power user |
| **Current Tools** | Google Sheets, personal email, text messages, paper checks, shoebox of receipts |
| **Annual Rental Revenue** | $30,000 - $300,000 |
| **Pain Intensity** | High at tax time, moderate year-round, spikes when maintenance issues arise |

---

## 2. Problem Statement

### The Core Problem

Small landlords (2-20 units) are trapped between two unacceptable options:

1. **Status quo**: Managing rental properties with spreadsheets, text messages, email threads, and paper -- leading to missed payments, lost receipts, maintenance chaos, and tax-time panic.
2. **Existing PM software**: Tools like AppFolio, Buildium, TenantCloud, and RentManager are designed for professional property managers with 100+ units. They are over-engineered, overpriced, and overwhelmingly complex for someone managing 5 rental properties.

### Evidence of the Gap

- **Reddit r/realestateinvesting** -- "What software do property managers use?" (91 comments): Top answer is "mainly Google Sheets."
- **Reddit r/landlord** -- "PM Softwares -- each has bad reviews" (111 comments): Frustrated small landlords describing bloated interfaces, unnecessary features, and pricing that does not justify value at small portfolio sizes.
- Existing tools price small landlords out: AppFolio minimums at $280/mo, Buildium starts at $55/mo for 50 units.
- A landlord with 4 units collecting $6,000/mo in rent cannot justify $55-280/mo for software they will use at 10% capacity.

### Key Pain Points (Ranked by Severity)

| Rank | Pain Point | Frequency | Current Workaround |
|---|---|---|---|
| 1 | Rent tracking -- who paid, who is late, how much is outstanding | Monthly | Spreadsheet or mental notes |
| 2 | Tax-time chaos -- scattered receipts, no P&L, Schedule E scramble | Annual | Shoebox of receipts + CPA fees |
| 3 | Maintenance coordination -- texts at 11pm, lost requests, no vendor list | Ongoing | Text messages and sticky notes |
| 4 | Lease storage -- paper leases, lost documents, missed renewal dates | Per lease cycle | Filing cabinet or desk drawer |
| 5 | Receipt generation -- tenants request receipts, landlord creates manually | Per payment | Word document or handwritten |
| 6 | Tenant disputes -- no communication log, no documentation | Episodic | "He said, she said" |

---

## 3. Target Users / Ideal Customer Profile (ICP)

### Primary ICP: The Side-Hustle Landlord

- Individual landlord with **2-20 residential units** (single-family homes, duplexes, small multifamily)
- Manages properties themselves -- no property management company
- Rental income supplements primary income or retirement
- Owns properties in 1-3 markets, typically within driving distance

### Secondary ICP: The Accidental Landlord

- Kept a previous home as a rental after moving
- Inherited a property and decided to rent it out
- 1-3 units, growing slowly
- Minimal property management knowledge, learning as they go

### Tertiary ICP: The Aspiring Investor

- Real estate investor just starting out
- Acquiring first 2-5 investment properties
- Wants organized systems from day one
- More tech-savvy, willing to try new tools

### Buying Triggers (Events That Drive Purchase)

| Trigger | Emotional State | Timing |
|---|---|---|
| Tax-time chaos | Frustrated, overwhelmed | January - April |
| Missed or late rent payment | Angry, anxious | Any time |
| Maintenance overload (multiple issues at once) | Stressed, reactive | Any time |
| Tenant dispute (payment disagreement, damage) | Defensive, seeking documentation | Any time |
| Property acquisition (adding units) | Organized, planning mode | Closing + 30 days |
| Accountant pushes for better records | Compliant, motivated | Q4 or tax season |

### Current Spend

- **Most spend $0/mo** on property management tools
- Some pay $10-15/mo for a basic accounting tool (QuickBooks Simple Start)
- Incidental costs: $200-500/yr extra CPA time due to disorganized records
- **Willingness to pay**: $15-100/mo if the tool demonstrably saves time and reduces stress

---

## 4. Feature Specification

### 4.1 Core Features (MVP -- Month 1-3)

#### A. Property & Unit Management

| Capability | Description |
|---|---|
| Add properties | Address, type (single-family, duplex, multifamily), number of units |
| Unit-level detail | Rent amount, lease dates, tenant info, property photos |
| Dashboard | All properties at a glance with occupancy status and monthly rent roll |
| Property status | Active, vacant, under-renovation tags |
| Quick actions | Mark unit vacant, add new tenant, log expense -- all from dashboard |

#### B. Tenant Management

| Capability | Description |
|---|---|
| Tenant profiles | Name, contact info, emergency contact, employer, ID upload |
| Lease document storage | Upload PDF or photo; auto-extract key dates (start, end, rent amount) |
| Lease expiry alerts | Configurable notifications at 90, 60, and 30 days before lease end |
| Communication log | In-app message history or linked SMS/email threads per tenant |
| Tenant timeline | Chronological view of all interactions, payments, and requests per tenant |

#### C. Rent Tracking & Collection

| Capability | Description |
|---|---|
| Monthly rent ledger | Per-unit view of expected, received, and outstanding payments |
| Bank feed matching | Connect bank account via Plaid; auto-match incoming payments to tenants |
| Manual payment entry | Log cash, check, Zelle, Venmo, or other payment methods |
| Late-rent reminders | Automated SMS + email with configurable grace periods (e.g., 5-day grace) |
| Late fee auto-calculation | Configurable late fee rules (flat or daily), auto-applied after grace period |
| Rent receipts | Auto-generated PDF receipts; downloadable or emailed directly to tenant |
| Payment history | Full audit trail of all payments with method, date, and status |

#### D. Maintenance Request Portal

| Capability | Description |
|---|---|
| Tenant-facing form | Web link (no app required for tenant) to submit maintenance requests |
| Photo/document upload | Tenants attach photos of the issue with their request |
| Priority levels | Emergency, urgent, and routine classifications |
| Status tracking | Submitted -> Acknowledged -> In-Progress -> Completed (visible to tenant) |
| Vendor/contractor list | Maintain a contact list of preferred vendors per property |
| Completion documentation | Upload photos of completed work for records |
| Notifications | SMS/email alerts to landlord on new requests; updates to tenant on status changes |

#### E. Expense Tracking

| Capability | Description |
|---|---|
| Categorize expenses | By property, unit, and IRS-compatible category |
| Receipt capture | Mobile camera scan with auto-crop and OCR |
| Recurring expenses | Set up automatic recurring entries for insurance, property tax, HOA, utilities |
| Mileage tracking | Log property visits with GPS-based mileage calculation |
| Expense reports | Monthly and annual summaries per property |
| Receipt storage | All receipts stored digitally, searchable, and linked to expense entries |

#### F. Financial Dashboard & Reports

| Capability | Description |
|---|---|
| Cash flow statement | Income vs. expenses per property, monthly or custom date range |
| Profit & Loss | Per-property P&L (monthly, quarterly, annual) |
| Occupancy rate | Portfolio-wide and per-property vacancy tracking |
| Rent collection rate | Percentage of rent collected vs. expected per month |
| Schedule E helper | IRS rental income/expense categories pre-mapped; exports directly to Schedule E format |
| Export options | CSV and PDF exports for accountant or personal records |
| Year-over-year comparison | Compare financial performance across periods |

---

### 4.2 Phase 2 Features (Month 4-6)

#### G. Online Rent Payments

| Capability | Description |
|---|---|
| ACH bank transfer | Free for tenant; low-cost for landlord via Stripe Connect |
| Credit/debit card payment | Tenant pays processing fee (configurable) |
| Auto-pay | Tenants set up automatic monthly rent payments |
| Payment splitting | Partial payments with landlord approval workflow |
| Payment processing | Powered by Stripe Connect (ACH + card) |
| Payment confirmation | Instant notification to landlord and tenant on successful payment |

#### H. Tenant Screening (Add-on)

| Capability | Description |
|---|---|
| Credit report pull | Full credit report with score |
| Background check | Criminal history search |
| Eviction history | National eviction database lookup |
| Income verification | Employment and income validation |
| Pricing | $25-45 per applicant (landlord or applicant pays) |
| Provider | TransUnion SmartMove API or equivalent |
| Report delivery | Digital report with pass/fail recommendation |

#### I. Digital Lease Signing

| Capability | Description |
|---|---|
| Lease templates | Pre-built, state-specific templates (Phase 2: top 10 states) |
| E-signature | Legally binding electronic signatures (ESIGN/UETA compliant) |
| Auto-populate | Pull tenant and property data into lease fields automatically |
| Version history | Track all lease versions and amendments |
| Signing workflow | Sequential signing (landlord first, then tenant) with email notifications |

#### J. Automated Notifications

| Notification Type | Channel | Trigger |
|---|---|---|
| Lease renewal reminder | Email + SMS | 90/60/30 days before lease end |
| Rent increase notice | Email + SMS + PDF | Configurable days before effective date |
| Property inspection scheduling | Email + SMS | Custom schedule or seasonal defaults |
| Insurance/tax payment reminder | Email + SMS | Linked to recurring expense due dates |
| Customizable templates | All | Landlord edits message tone and content |
| Rent control compliance | Email alert | Flags if proposed increase exceeds local rent control limits |

---

### 4.3 Phase 3 Features (Month 7-12)

#### K. Accounting Integration

| Capability | Description |
|---|---|
| QuickBooks Online sync | Bi-directional sync of income, expenses, and categories |
| Xero sync | Alternative accounting platform integration |
| Year-end tax package | Auto-generated Schedule E pre-filled report |
| 1099 generation | Create and file 1099-NEC for contractors paid $600+ |
| Accountant access | Read-only accountant view with export capabilities |

#### L. Tenant Portal (Optional Branded)

| Capability | Description |
|---|---|
| Self-service | Tenants pay rent, submit maintenance requests, view lease, download receipts |
| White-label option | Landlord's own branding (logo, colors, domain) |
| Mobile-responsive | Web app optimized for mobile -- no app store download required |
| Communication center | In-app messaging between tenant and landlord |

#### M. Multi-User & Collaboration

| Capability | Description |
|---|---|
| Invite collaborators | Add co-landlord, spouse, assistant, or property manager |
| Role-based access | Owner (full), Manager (operational), Viewer (read-only) |
| Activity log | Full audit trail of all actions taken by each user |
| Property manager handoff | One-click transition mode for hiring a PM or self-managing |

#### N. Smart Insights

| Capability | Description |
|---|---|
| Rent comparison | Compare current rent vs. market rates (Zillow/Comps data) |
| Expense anomaly detection | Alerts on unusual expense spikes or outliers |
| ROI per property | Cap rate, cash-on-cash return, and total ROI calculations |
| Mortgage tracking | Refinance analysis and mortgage payoff timeline |
| Portfolio projections | Growth modeling based on current performance and market trends |

---

## 5. Technical Architecture

### 5.1 Recommended Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend (Mobile)** | React Native or Flutter | Mobile-first, cross-platform (iOS + Android) from single codebase |
| **Frontend (Web)** | Next.js (React) | Server-side rendering for SEO (landing pages), responsive web dashboard |
| **Backend** | Node.js (NestJS) or Python (FastAPI) | Modern, well-supported frameworks with strong ecosystem for SaaS |
| **Database** | PostgreSQL (primary) + Redis (caching, job queues) | Relational data model fits property/tenant/payment relationships; Redis for performance |
| **File Storage** | AWS S3 or Cloudflare R2 | Documents, photos, receipts, lease PDFs |
| **Payment Processing** | Stripe Connect | ACH + card payments; handles split payments, payouts, and PCI compliance |
| **Bank Feed Integration** | Plaid API | Bank account linking, transaction history, and payment matching |
| **SMS/Email** | Twilio (SMS), Resend or SendGrid (email) | Reliable delivery, templating, and delivery tracking |
| **E-Signature** | Dropbox Sign (HelloSign) or DocuSign API | Legally binding e-signatures with audit trail |
| **Tenant Screening** | TransUnion SmartMove API or RentPrep API | Credit, background, eviction checks |
| **Hosting** | AWS (production) or Railway/Render (early stage) | Scalable infrastructure; early-stage platforms for speed of deployment |
| **Auth** | Auth0 or Clerk | Multi-tenant authentication, role-based access, social login |

### 5.2 Key Integrations

| Integration | Purpose | API / Provider | Phase |
|---|---|---|---|
| Plaid | Bank feed matching for rent payments | Plaid Link + Transactions API | MVP |
| Stripe Connect | Online rent collection (ACH + card) | Stripe Payments + Connect | Phase 2 |
| Twilio | SMS reminders and maintenance notifications | Twilio Messaging API | MVP |
| TransUnion SmartMove | Tenant screening (credit + background) | SmartMove API | Phase 2 |
| Dropbox Sign / DocuSign | Digital lease signing | HelloSign API | Phase 2 |
| QuickBooks Online | Accounting sync | QBO API (OAuth 2.0) | Phase 3 |
| Google Maps / Mapbox | Property location display, rent comps | Maps Platform API | Phase 3 |
| IRS TIN Matching | 1099 generation | IRS TIN Matching Program | Phase 3 |

### 5.3 Data Model (Core Entities)

```
User (Landlord Account)
  |-- Property (address, type, units, documents)
  |     |-- Unit (rent amount, status, lease dates, photos)
  |     |     |-- Lease (start, end, rent amount, terms, signed document)
  |     |     |     |-- Tenant (name, contact, emergency contacts, employer, ID)
  |     |     |
  |     |     |-- Payment (amount, date, method, status, matched transaction)
  |     |     |-- MaintenanceRequest (description, photos, status, vendor, timeline)
  |     |
  |     |-- Expense (category, amount, date, receipt, unit association)
  |     |-- Vendor (name, trade, contact info, insurance, notes)
  |
  |-- Notification (type, channel, status, recipient, schedule)
  |-- Subscription (plan, billing cycle, payment method, status)
```

**Entity Relationships:**
- One User has many Properties
- One Property has many Units
- One Unit has one active Lease (and historical Leases)
- One Lease belongs to one Tenant (or multiple for co-tenants)
- One Unit has many Payments (monthly recurring)
- One Unit has many MaintenanceRequests
- One Property has many Expenses (some unit-specific, some property-wide)
- One User has many Vendors (shared across properties)

### 5.4 Security & Compliance

| Area | Approach |
|---|---|
| **SOC 2** | Type I at launch; Type II certification within 12 months |
| **Encryption at rest** | AES-256 for all stored data |
| **Encryption in transit** | TLS 1.3 for all API and web traffic |
| **PII handling** | Compliant with state privacy laws (CCPA, VCDPA, etc.) |
| **PCI-DSS** | Via Stripe -- no card data stored on our servers |
| **Fair Housing Act** | Built-in compliance guidance for screening and communications |
| **Landlord-tenant law** | State-specific compliance rules engine (Phase 3) |
| **Backups** | Automated daily backups with 30-day retention |
| **Data portability** | GDPR-ready data export and deletion (for international expansion) |
| **Access controls** | Role-based permissions, 2FA support, session management |

---

## 6. Pricing Strategy

### 6.1 Pricing Tiers

| Tier | Units | Monthly Price | Annual Price (Save 15%) | Key Features |
|---|---|---|---|---|
| **Starter** | 1-5 units | $5/unit/mo (min $15/mo) | $4.25/unit/mo | Core PM, rent tracking, maintenance portal, expense tracking, basic reports, Schedule E helper |
| **Growth** | 6-15 units | $7/unit/mo | $5.95/unit/mo | Everything in Starter + online rent payments (ACH + card), tenant screening, digital leases, automated notifications |
| **Pro** | 16-20 units | $9/unit/mo | $7.65/unit/mo | Everything in Growth + QBO/Xero sync, smart insights, multi-user access, branded tenant portal |
| **Portfolio** | 21-50 units | $8/unit/mo | $6.80/unit/mo | Everything in Pro + dedicated account manager, API access, custom branding, priority support |

> **Note**: Minimum subscription is $15/month (Starter tier with 1-3 units). This covers baseline infrastructure and support costs.

### 6.2 Add-on Pricing

| Add-on | Price | Notes |
|---|---|---|
| Tenant Screening | $25-35 per applicant | Pass-through cost; landlord or applicant can pay |
| Premium Lease Templates | $9.99/mo | State-specific, attorney-reviewed lease templates |
| Custom Branding | $19.99/mo | White-label tenant portal, custom domain, branded emails |
| Priority Support | $14.99/mo | Phone support included, 2-hour response SLA during business hours |

### 6.3 Pricing Rationale

| Factor | Analysis |
|---|---|
| **Competitor pricing** | Buildium: $55+/mo for 50 units ($1.10/unit); AppFolio: $280+/mo minimum; TenantCloud: $12-45/mo (bloated) |
| **Our wedge** | Per-unit pricing that makes sense at 3 units ($15/mo) and scales linearly with portfolio growth |
| **Value anchor** | One recovered late payment ($50-100) or one avoided vacancy day ($50-150) pays for a full year of subscription |
| **Trial strategy** | Free 14-day trial with no credit card required to minimize friction |
| **Conversion target** | 10-15% free-to-paid conversion within 60 days of signup |
| **Annual incentive** | 15% discount for annual prepayment improves cash flow and reduces churn |

### 6.4 Revenue Modeling (Conservative)

| Month | Paying Customers | Avg Units/Customer | MRR | ARR Run Rate |
|---|---|---|---|---|
| 3 (Launch) | 20 | 4.5 | $900 | $10,800 |
| 6 | 50 | 5.0 | $2,500 | $30,000 |
| 9 | 150 | 5.5 | $8,250 | $99,000 |
| 12 | 400 | 6.0 | $24,000 | $288,000 |
| 18 | 1,500 | 6.5 | $97,500 | $1,170,000 |

---

## 7. Go-to-Market Strategy

### 7.1 Launch Channels

| Channel | Approach | Audience Size | Priority |
|---|---|---|---|
| **Reddit** | Organic posts in r/realestateinvesting (1.2M), r/landlord, r/realestate, r/smallbusiness | 2M+ combined | High |
| **BiggerPockets** | Forum participation, marketplace listing, sponsored content | 2M+ members | High |
| **Facebook Groups** | "Landlord & Property Manager" groups, "Real Estate Investor" groups | 500K+ combined | Medium |
| **SEO Content** | Blog: "How to manage rental properties with spreadsheets" -> conversion funnel to product | Organic search | High |
| **YouTube** | Sponsorships on landlord/investor channels; tutorial content on own channel | Niche but engaged | Medium |
| **Local REIA** | Meetups, presentations, partnerships with real estate investor associations | Local, high-intent | Medium |
| **Podcasts** | Guest appearances on real estate investing podcasts (BiggerPockets, Best Ever, etc.) | High-intent listeners | Medium |
| **Product Hunt** | Launch day push for visibility and backlinks | Tech-savvy early adopters | Low |

### 7.2 Growth Loops

**Loop 1 -- Tenant Referral Loop**
> Tenants using the maintenance portal or rent payment interface see "Powered by RentLite" with a signup call-to-action. Many tenants are also landlords or know landlords.

**Loop 2 -- Accountant Referral Loop**
> Schedule E export includes "Prepared with RentLite." Accountants who receive clean, organized reports recommend the tool to other landlord clients.

**Loop 3 -- Contractor/Vendor Loop**
> Vendors and contractors receiving digital work orders through the platform see the tool in action and recommend it to other landlords they work with.

### 7.3 Content Marketing Strategy

| Content Type | Topics | Funnel Stage |
|---|---|---|
| Blog posts | "Schedule E for rental properties explained," "How to track rental income for taxes" | Awareness (SEO) |
| Guides | "The small landlord's guide to managing 5-10 units," "Rent collection best practices" | Consideration |
| Templates | Free rent receipt template, free lease template (basic) | Lead generation |
| Calculators | Rental property ROI calculator, cap rate calculator | Awareness + lead gen |
| Case studies | "How [Landlord] saved 10 hours/month managing 8 units" | Decision |

### 7.4 Key Metrics to Track

| Metric | Target (Month 6) | Target (Month 12) | Target (Month 18) |
|---|---|---|---|
| Registered landlords | 500 | 3,000 | 10,000 |
| Paying customers | 50 | 400 | 1,500 |
| Monthly Recurring Revenue (MRR) | $500 | $5,000 | $20,000 |
| Monthly churn rate | <8% | <5% | <4% |
| Net Promoter Score (NPS) | >40 | >50 | >60 |
| Customer Acquisition Cost (CAC) | <$50 | <$40 | <$30 |
| Lifetime Value (LTV) | >$300 | >$400 | >$500 |
| LTV:CAC ratio | >3:1 | >5:1 | >10:1 |
| Free trial to paid conversion | 8% | 12% | 15% |
| Monthly active usage (of paying) | 70% | 80% | 85% |

---

## 8. Competitive Landscape

### 8.1 Competitor Comparison

| Competitor | Target Market | Pricing | Strengths | Weaknesses |
|---|---|---|---|---|
| **AppFolio** | 50+ units | $1.40/unit/mo (min $280/mo) | Full-featured, AI leasing assistant, strong brand | Way too complex and expensive for small landlords; minimum price excludes our ICP entirely |
| **Buildium** | 50+ units | $55/mo (50 units) | Strong accounting, established reputation | Minimum pricing too high for small portfolios; complex UX with steep learning curve |
| **TenantCloud** | 1-150 units | Free - $45/mo | Free tier available, broad feature set | Bloated interface, poor mobile UX, consistently bad reviews on Capterra and G2 |
| **TurboTenant** | 1-50 units | Free - $30/mo | Free tenant screening, simple interface | Limited property management features; primarily a screening and listing tool |
| **RentRedi** | 1-50 units | $12-30/mo | Mobile-first approach, relatively simple | Limited financial reporting; no bank feed matching; weak expense tracking |
| **Avail (CoStar)** | 1-50 units | Free - $22/unit/mo | Backed by CoStar, good listing syndication | Getting more expensive; CoStar integration adding bloat; pricing trending upward |
| **Rentec Direct** | 10-500 units | $25-75/mo | Affordable, decent feature set | Outdated UI, poor mobile experience, targets larger portfolios |
| **RentLite (Ours)** | **2-20 units** | **$5-9/unit/mo** | **Dead simple, mobile-first, bank feed matching, Schedule E tax helper, per-unit pricing** | **New entrant, smaller feature set at launch, no brand recognition yet** |

### 8.2 Competitive Positioning Map

```
                    Simple                          Complex
                    ^                                 ^
                    |                                 |
   Low Price  ------|---------- RentLite ------------|----- TenantCloud
                    |             (target)            |
                    |                                 |
                    |   RentRedi      TurboTenant     |
                    |                                 |
   High Price ------|                                 |----- AppFolio
                    |                Avail            |     Buildium
                    |                                 |
```

### 8.3 Competitive Wedge -- How We Win

| Advantage | Explanation |
|---|---|
| **Simplicity** | Existing tools try to be enterprise-grade property management platforms. We intentionally constrain scope to what a 5-unit landlord actually needs. |
| **Pricing** | Per-unit pricing that makes financial sense at 3 units ($15/mo). No minimums that price out small portfolios. Linear scaling as the portfolio grows. |
| **Mobile-first design** | Small landlords manage properties on-the-go -- between their day job, driving to properties, and handling maintenance. The phone is the primary device. |
| **Tax readiness** | The Schedule E helper is a killer feature at tax time. No other tool in this price range maps expenses to IRS categories and exports a pre-filled Schedule E. |
| **Bank feed matching** | Auto-matching rent payments from bank feeds eliminates the #1 pain point: "Did that deposit come from Tenant A or Tenant B?" Zero manual data entry for bank-transferred rent. |
| **Niche focus** | By serving only 2-20 unit landlords, every feature decision is filtered through "does this help someone managing a handful of properties?" -- not a 500-unit portfolio manager. |

---

## 9. Risk Assessment

| # | Risk | Likelihood | Impact | Severity | Mitigation Strategy |
|---|---|---|---|---|---|
| 1 | **Low initial adoption** -- Landlords are notoriously slow to adopt new technology | Medium | High | **High** | Free 14-day trial (no CC required); aggressive BiggerPockets and Reddit community seeding; content marketing; partner with landlord influencers |
| 2 | **High churn due to property sales** -- Small landlords may sell properties and exit the market | Medium | Medium | **Medium** | Portfolio tracking that handles property sales gracefully; transition path to investor-only tools; referral incentives before exit |
| 3 | **Plaid/Stripe integration costs** -- API costs may erode margins at low price points | Low | High | **Medium** | Negotiate volume pricing early with Plaid and Stripe; evaluate Dwolla as lower-cost ACH alternative; monitor per-transaction economics monthly |
| 4 | **State-specific compliance complexity** -- Landlord-tenant laws vary significantly by state | High | Medium | **High** | Phase rollout state-by-state; start with top 10 states by landlord population; partner with legal review services; build configurable rules engine |
| 5 | **Competitor response** -- TurboTenant, Avail, or new entrants add a "simple mode" | Medium | Medium | **Medium** | Move fast; build deep brand loyalty in niche communities (Reddit, BiggerPockets); create switching costs via data depth (payment history, expense records) |
| 6 | **Data breach / PII exposure** -- Handling tenant PII creates significant liability | Low | Very High | **High** | SOC 2 certification roadmap; AES-256 encryption; minimal PII collection policy; cyber insurance; regular penetration testing; incident response plan |
| 7 | **Mobile app store rejection** -- Apple/Google may reject app for policy violations (e.g., financial services) | Low | Medium | **Medium** | Web-first approach (PWA) as fallback; pre-submit for app store review early; maintain compliance with store guidelines |
| 8 | **Tenant adoption friction** -- Tenants may resist using a new portal for rent or maintenance | Medium | Low | **Low** | Tenant-facing features require no app download (web links); make portal optional -- landlord can still log everything manually |

### Risk Severity Matrix

```
           Low Impact    Medium Impact    High Impact    Very High Impact
           ----------    -------------    -----------    ----------------
High       |             | #4 Compliance  |              |
Likelihood |             |                |              |
           |             |                |              |
Medium     |             | #2 Churn       | #1 Adoption  |
Likelihood |             | #5 Competitor  |              |
           |             |                |              |
Low        |             | #7 App Store   | #3 API Costs | #6 Data Breach
Likelihood |             |                |              |
```

---

## 10. MVP Roadmap

### Month 1-2: Foundation

| Week | Deliverables | Success Criteria |
|---|---|---|
| 1-2 | User authentication (signup, login, forgot password, email verification) | User can create account and log in on mobile and web |
| 2-3 | Property CRUD (add, edit, delete properties with address, type, photos) | Landlord can add all their properties in under 5 minutes |
| 3-4 | Unit management (add units per property, set rent, assign status) | Unit-level rent roll visible on dashboard |
| 4-5 | Tenant profiles (add tenant, contact info, emergency contact, ID upload) | Complete tenant record per occupied unit |
| 5-6 | Lease storage (upload PDF/photo, manually enter key dates) | Lease document viewable in-app with expiry date visible |
| 6-8 | Basic rent ledger (manual payment entry, monthly view per unit) | Landlord can see who paid and who owes for current month |
| 7-8 | Mobile-responsive bottom navigation and core UI shell | All core screens accessible from mobile with intuitive navigation |

### Month 2-3: Core Value

| Week | Deliverables | Success Criteria |
|---|---|---|
| 8-9 | Bank feed connection via Plaid (account linking, transaction pull) | Landlord connects bank account in under 2 minutes |
| 9-10 | Auto-match rent payments (match bank deposits to tenants) | System correctly matches 80%+ of rent payments automatically |
| 10-11 | Maintenance request portal (tenant-facing web link, photo upload) | Tenant submits request via link without any account creation |
| 11-12 | Expense tracking (categorize, receipt photo capture, recurring setup) | Landlord logs expense with receipt in under 30 seconds |
| 12-13 | Automated rent reminders (SMS + email, configurable schedule) | Late-paying tenant receives automated reminder within grace period |
| 13 | Rent receipt generation (auto-generate PDF, email to tenant) | One-click receipt generation and delivery |

### Month 3: Reports & Launch

| Week | Deliverables | Success Criteria |
|---|---|---|
| 13-14 | Cash flow dashboard (income vs. expenses, per property) | Visual dashboard showing monthly cash flow per property |
| 14 | P&L per property (monthly, quarterly, annual views) | Landlord can see net income per property for any period |
| 14-15 | Schedule E helper (IRS category mapping, export) | Expenses auto-categorized to Schedule E line items |
| 15 | Onboarding wizard (guided setup flow for new users) | New user completes property + tenant setup in under 10 minutes |
| 15-16 | Landing page + waitlist + launch page | SEO-optimized landing page with clear value proposition and CTA |
| 16 | Free 14-day trial flow (no CC required, Stripe billing) | User signs up, uses trial, and converts to paid without friction |
| 16 | Stripe billing integration (subscription management for our product) | Automated billing, plan upgrades/downgrades, and invoicing |

### Month 4-6: Growth Features

| Month | Deliverables | Success Criteria |
|---|---|---|
| 4 | Online rent payments (ACH + card via Stripe Connect) | Tenant can pay rent online; landlord receives funds |
| 4 | Tenant screening integration (credit + background + eviction) | Screening report delivered within 24 hours of request |
| 5 | Digital lease signing (templates for top 10 states, e-signature) | Landlord generates and sends lease; tenant signs digitally |
| 5 | Notification engine (lease renewal, rent increase, inspections) | Automated notifications fire on correct schedule |
| 6 | Rent increase compliance (rent control checks for major metros) | System flags non-compliant rent increases before sending |
| 6 | Polish, performance optimization, and bug fixes | App loads in under 2 seconds; zero critical bugs |

### Month 7-12: Scale

| Month | Deliverables | Success Criteria |
|---|---|---|
| 7 | QuickBooks Online sync (bi-directional) | Expenses and income sync to QBO within 1 hour |
| 8 | Tenant self-service portal (pay rent, maintenance, lease view) | Tenant completes full self-service workflow without landlord involvement |
| 8 | Xero sync (alternative to QBO) | Xero users have equivalent sync capability |
| 9 | Multi-user collaboration (invite, roles, permissions) | Co-landlord can access and manage shared properties |
| 9 | Activity log / audit trail | All user actions logged and viewable |
| 10 | Smart insights (rent comps, ROI calculator) | Landlord sees market rent comparison for each unit |
| 10 | Mortgage tracking and refinance analysis | Loan details stored; payoff date calculated |
| 11 | State-by-state compliance rules (top 20 states) | Compliance checks active for majority of user base |
| 11 | 1099 generation for contractors | Year-end 1099-NEC generated and ready to file |
| 12 | API for third-party integrations | Documented REST API available for partners |
| 12 | Year-end tax package (pre-filled Schedule E export) | One-click tax report generation ready for CPA |

---

## Appendix A: Assumptions & Open Questions

### Key Assumptions
1. Small landlords are willing to pay $15-100/mo for a tool that demonstrably saves time
2. Bank feed matching (Plaid) can achieve 80%+ auto-match accuracy for rent payments
3. Tenant-facing web links (no app required) will achieve higher adoption than app-required solutions
4. The Schedule E helper is a strong enough differentiator to drive organic word-of-mouth
5. Per-unit pricing resonates better than flat-tier pricing with this audience

### Open Questions to Validate
1. What is the actual willingness to pay for landlords with 3-5 units? (Needs survey/interview data)
2. Can we achieve unit economics at $5/unit/mo with Plaid and Twilio costs?
3. Which 10 states should we prioritize for lease templates and compliance rules?
4. Is there demand from the "accidental landlord" segment (1-2 units) that justifies a cheaper tier?
5. What is the realistic timeline for SOC 2 Type II certification for a startup of this size?

---

## Appendix B: Glossary

| Term | Definition |
|---|---|
| **ICP** | Ideal Customer Profile -- the target customer segment most likely to buy and retain |
| **MRR** | Monthly Recurring Revenue -- predictable subscription revenue per month |
| **ARR** | Annual Recurring Revenue -- MRR multiplied by 12 |
| **CAC** | Customer Acquisition Cost -- total marketing/sales spend per new customer |
| **LTV** | Lifetime Value -- total revenue expected from a customer over their lifetime |
| **NPS** | Net Promoter Score -- customer satisfaction metric from -100 to +100 |
| **Schedule E** | IRS tax form for reporting rental income and expenses |
| **ACH** | Automated Clearing House -- electronic bank-to-bank payment network |
| **SOC 2** | Service Organization Control 2 -- security and compliance certification |
| **PWA** | Progressive Web App -- web application with native app-like capabilities |
| **REIA** | Real Estate Investor Association -- local networking groups for investors |

---

*End of document. This is a living document and should be updated as market research, user interviews, and technical feasibility assessments provide new data.*
