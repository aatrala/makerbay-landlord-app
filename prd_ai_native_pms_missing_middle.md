# PRD: AI-Native Property Management System for the "Missing Middle"

**Product Name**: Homeflow (working title)
**Version**: 1.0
**Author**: pm-bajaji
**Date**: 2026-09-13
**Status**: Draft

---

## 1. Summary

Homeflow is an AI-native property management system (PMS) designed specifically for independent residential property managers and small PM firms managing **20–200 units** — the "missing middle" of the residential property management market.

Today, these operators are trapped between enterprise-grade tools (Yardi Voyager, MRI Software) that are too expensive, complex, and slow to implement, and lightweight landlord apps (TenantCloud, basic DoorLoop) that lack the depth needed for professional-grade operations. Homeflow closes this gap with a modern, AI-first platform that automates the three biggest time sinks — maintenance triage, owner reporting, and tenant communication — while delivering best-in-class UX for accounting, leasing, and compliance.

**Target outcome**: Reduce operational overhead by 40–60% for PMs in the 20–200 unit range, enabling them to manage more units without proportional headcount growth.

---

## 2. Background and Evidence

### Market Context

| Metric | Value | Source |
|--------|-------|--------|
| Residential PM software market (2026) | $30.8B | Grand View Research |
| Projected market (2033) | $60.35B | Grand View Research |
| CAGR | 10.1% | Grand View Research |
| PM firms in the 20–200 unit range (US) | ~50,000+ | NARPM, IREM industry data |
| Average units managed per PM staff | 40–60 | NARPM operations survey |

### Pain Point Evidence

| Pain Point | Source | Frequency |
|------------|--------|-----------|
| "Missing middle" gap — tools are either too enterprise or too basic | Reddit r/PropertyManagement (15+ threads, 2024–2026) | Very High |
| Maintenance coordination is the #1 time sink | G2 reviews for Buildium/AppFolio, Reddit, YouTube PM channels | Very High |
| Owner reporting takes 1–3 days/month manually | Reddit r/PropertyManagement, PM influencer channels | High |
| Tenant screening is expensive ($30–$50/applicant) and inconsistent | Capterra reviews, G2 | High |
| Compliance with local tenant laws is increasingly complex | Reddit r/Landlord, legal publications | High |
| Late rent collection and arrears management is labor-intensive | Reddit, industry publications | Medium-High |
| Legacy tools have poor UX, slow support, and opaque pricing | G2 reviews for Yardi, MRI, Buildium (consistent theme) | Very High |

### Competitive Landscape

| Competitor | Strengths | Weaknesses | Pricing |
|------------|-----------|------------|---------|
| **AppFolio** | Best mid-market product, strong mobile, AI features emerging | Moving upmarket, pricing increases, not AI-native | $1.40/unit/mo (min $299/mo) |
| **Buildium** | Solid accounting, good for small-mid PMs | Dated UI, slow innovation, acquired by RealPage | $55–$625+/mo |
| **Yardi Voyager** | Enterprise-grade, comprehensive | Overkill for <200 units, complex, expensive | Custom ($1,000+/mo) |
| **Yardi Breeze** | Simplified Yardi for small PMs | Still clunky, limited features | $1/unit/mo (min $100/mo) |
| **DoorLoop** | Modern UX, fast onboarding, affordable | Lighter feature set, newer, not AI-native | $59–$299/mo |
| **TenantCloud** | Free tier, good for small landlords | Limited at scale, basic reporting | Free–$55/mo |
| **Rent Manager** | Deep features, good for mid-size | Windows-only desktop app, dated UI | Custom |
| **Simplifyas** | Modern, affordable, good reviews | Smaller feature set, newer | $1/unit/mo |

### Competitive Gap

No existing product is **AI-native** — meaning AI is not bolted onto an existing architecture but is the core design principle. Every competitor treats AI as an add-on feature (e.g., "AI assistant" chatbot). Homeflow uses AI as the foundational layer for maintenance triage, financial reporting, tenant communication, lease abstraction, and compliance monitoring.

---

## 3. Goal and Success Criteria

### Product Goals

1. **Eliminate the "missing middle" gap** by delivering enterprise-grade capability with small-tool simplicity for PMs managing 20–200 units.
2. **Reduce operational overhead** by 40–60% through AI-native automation of the top 3 time sinks: maintenance triage, owner reporting, and tenant communication.
3. **Achieve fastest time-to-value** in the category — PMs should be fully operational within 48 hours, not 4–8 weeks.
4. **Create a defensible AI moat** through proprietary models trained on PM-specific data (maintenance patterns, financial reporting templates, tenant communication flows).

### Success Criteria (12 months post-launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Paying customers | 500+ PM firms | Internal dashboard |
| Units under management | 50,000+ | Internal dashboard |
| Monthly churn rate | <2% | Internal dashboard |
| NPS score | >50 | Quarterly survey |
| Time-to-first-value | <48 hours | Onboarding analytics |
| AI automation rate | >60% of maintenance requests auto-triaged | Product analytics |
| Owner report generation time | <5 minutes (vs. 1–3 days manual) | Product analytics |
| G2 rating | >4.5/5 | G2 |

---

## 4. Users and Scenarios

### Primary Users

| User | Role | Key Needs | Frequency |
|------|------|-----------|-----------|
| **Property Manager (PM)** | Day-to-day operations lead | Maintenance coordination, tenant communication, lease management, rent collection | Daily |
| **PM Firm Owner / Principal** | Business owner, oversees multiple PMs | Portfolio visibility, owner reporting, financial performance, staff management | Weekly |
| **Accounting / Bookkeeper** | Financial operations | AP/AR, GL, owner distributions, tax reporting | Daily/Weekly |
| **Maintenance Technician / Coordinator** | Work order management | Work order intake, vendor dispatch, completion tracking | Daily |

### Secondary Users

| User | Role | Key Needs | Frequency |
|------|------|-----------|-----------|
| **Property Owner** | Asset owner, hires PM firm | Financial reports, property performance, approval workflows | Monthly |
| **Tenant** | Resident | Rent payment, maintenance requests, lease documents, communication | As needed |
| **Vendor / Contractor** | Service provider | Work order receipt, scheduling, invoicing | As needed |

### Key Scenarios

**Scenario 1: New PM Onboarding**
Sarah manages 85 units across 3 properties. She's currently using spreadsheets and QuickBooks. She signs up for Homeflow, imports her tenant roster via CSV, connects her bank account, and within 48 hours she's collecting rent, tracking maintenance, and generating owner reports — all from a single dashboard.

**Scenario 2: AI Maintenance Triage**
A tenant submits a maintenance request at 11 PM: "Water is leaking under my kitchen sink." Homeflow's AI categorizes it as "plumbing — urgent," assesses severity based on description + photos, auto-drafts a work order, identifies the closest available plumber from the vendor list, sends the tenant an acknowledgment with expected response time, and escalates to the PM only if the tenant marks it as critical or the AI confidence is below threshold.

**Scenario 3: Monthly Owner Reporting**
On the 1st of each month, Homeflow auto-generates financial reports for each property owner: income summary, expense breakdown, maintenance costs vs. budget, vacancy status, rent roll, and key metrics (NOI, cap rate, delinquency rate). The PM reviews and approves with one click. What used to take 2 days now takes 10 minutes.

**Scenario 4: Lease Renewal with AI Recommendations**
A lease expires in 60 days. Homeflow's AI analyzes comparable rents in the area, the tenant's payment history, maintenance request frequency, and market vacancy rates to recommend: (a) renewal at $X/month, (b) increase of Y%, or (c) non-renewal with justification. The PM reviews the recommendation and sends the lease renewal offer with one click.

**Scenario 5: Compliance Alert**
A new local ordinance changes security deposit limits in the PM's jurisdiction. Homeflow detects the regulatory change, flags affected leases, auto-updates the lease template for new agreements, and generates a compliance checklist for existing leases that may need adjustment.

---

## 5. Scope

### In Scope (v1.0)

| Module | Description |
|--------|-------------|
| **Property & Unit Management** | Property setup, unit configuration, amenity tracking, photo/media management |
| **Tenant Lifecycle** | Applications, screening, lease signing (e-sign), move-in/move-out, renewals, terminations |
| **Rent Collection & Accounting** | Online rent payment (ACH + card), auto-ledger, AP/AR, bank reconciliation, owner distributions, GL |
| **AI Maintenance Triage** | Tenant request intake (web + mobile + phone), AI categorization + priority scoring, auto work order creation, vendor dispatch, completion tracking, tenant communication |
| **AI Owner Reporting** | Auto-generated monthly/quarterly/annual reports, customizable templates, one-click distribution, owner portal |
| **AI Tenant Communication** | AI-powered responses to common queries, missed-call recovery, automated announcements, maintenance status updates |
| **Vendor Management** | Vendor directory, insurance certificate tracking, performance scoring, invoicing, payment |
| **Document Management** | Lease templates, e-signatures, document repository, auto-generated disclosures |
| **Owner Portal** | Owner login, financial reports, approval workflows, property performance dashboard |
| **Tenant Portal + Mobile App** | Rent payment, maintenance requests, lease documents, communication, community announcements |
| **Compliance Monitoring** | Jurisdiction-aware regulatory tracking, lease template auto-updates, disclosure generation, inspection scheduling |
| **Integrations** | QuickBooks Online, Stripe, Plaid (bank connections), DocuSign, Zillow Rentals, Apartments.com |
| **AI Lease Analysis** | Lease abstraction, critical date extraction, renewal recommendation engine |

### Dependencies

- Payment processing partner (Stripe or equivalent)
- Bank connection provider (Plaid or equivalent)
- E-signature provider (DocuSign or equivalent)
- Tenant screening data provider (TransUnion Equifax Experian)
- AI/ML infrastructure (OpenAI API or equivalent for NLP, custom models for triage)
- Mapping/geocoding API for property locations

### Assumptions

- Target users have basic digital literacy (email, web browsing) but are not power users.
- Most PMs in this range use a combination of spreadsheets + QuickBooks + phone/email today.
- AI models can achieve >80% accuracy on maintenance triage within 6 months of training data availability.
- E-signature is legally acceptable for lease execution in target jurisdictions (confirmed for 48 states).
- ACH payment adoption among tenants is acceptable with proper incentives (lower fees vs. credit card).

---

## 6. Non-Goals

| Non-Goal | Rationale |
|----------|-----------|
| **Not for large enterprise PMs (200+ units)** | Enterprise PMs need multi-entity consolidation, complex budgeting, and custom workflows that would bloat the product. They are served by Yardi Voyager and MRI. |
| **Not for commercial property management** | Commercial PM has fundamentally different workflows (CAM reconciliation, lease administration, tenant improvement). A separate product would be needed. |
| **Not a property listing / marketing platform** | Syndication to Zillow, Apartments.com is an integration, not a core feature. Building a listing platform is a different business. |
| **Not a construction / renovation management tool** | Renovation project management is a separate workflow. We integrate with accounting for expense tracking but do not manage projects. |
| **Not a tenant screening bureau** | We aggregate screening data from existing bureaus (TransUnion, Equifax, Experian) but do not build our own credit/criminal/eviction data infrastructure. |
| **Not a general-purpose accounting system** | We provide property-specific accounting (GL, AP/AR, owner distributions) but do not replace QuickBooks for firm-level accounting. Integration, not replacement. |
| **Not a smart home / IoT platform** | We integrate with smart locks and thermostats for access control and energy management but do not build device management infrastructure. |
| **No AI chatbot that replaces human PM** | AI assists and automates, but tenant-facing communication always has a human escalation path. AI never makes final decisions on evictions, lease terminations, or financial disputes. |

---

## 7. User Flow

### 7.1 PM Onboarding Flow

```
Sign Up → Firm Profile Setup → Property Import (CSV/API) → Unit Configuration
→ Bank Connection (Plaid) → Payment Processing Setup (Stripe) → Tenant Roster Import
→ Lease Document Upload → Owner Setup → Vendor Directory → First Maintenance Request
→ First Owner Report → Go Live
```

**Key design principles**:
- Maximum 48 hours from sign-up to fully operational.
- Guided setup wizard with progress indicator.
- CSV import templates for tenants, units, owners, and vendors.
- Pre-built lease templates by state/jurisdiction.
- Sandbox mode for testing before going live.

**Empty states**:
- No properties yet: "Add your first property" with guided setup.
- No tenants yet: "Import tenants from CSV" or "Add manually."
- No maintenance requests: "Here's how maintenance requests work" with demo.

### 7.2 Tenant Maintenance Request Flow

```
Tenant submits request (web/mobile/phone)
→ AI categorizes type + urgency + priority score
→ [If high confidence] Auto-create work order + notify vendor + update tenant
→ [If low confidence] Route to PM for manual review
→ Vendor accepts + schedules → Tenant notified with ETA
→ Vendor completes + uploads photos → PM notified for approval
→ PM approves → Vendor paid → Tenant notified + satisfaction survey
```

**AI triage logic**:
- Input: text description + photos + tenant history + property age + unit type.
- Output: category (plumbing/electrical/HVAC/appliance/structural/pest/other), urgency (emergency/urgent/routine), estimated cost range, recommended vendor.
- Confidence threshold: >80% auto-dispatch; <80% route to PM.

**Error states**:
- Tenant submits duplicate request: AI detects and merges, notifies tenant.
- Vendor does not respond within SLA: auto-escalate to backup vendor + notify PM.
- Tenant marks issue as resolved but it recurs within 7 days: auto-reopen + escalate.

### 7.3 Owner Reporting Flow

```
Month-end close triggered (auto or manual)
→ AI compiles financial data: rent roll, income, expenses, maintenance, vacancy
→ AI generates narrative summary: key metrics, trends, action items
→ PM reviews draft report → edits if needed → approves
→ Report auto-distributed to owner via email + owner portal
→ Owner can drill into details or ask questions via portal
```

### 7.4 Lease Renewal Flow

```
60 days before lease expiry → AI flag
→ AI analyzes: comparable rents, tenant payment history, maintenance frequency, market vacancy
→ AI recommendation: renew at $X / increase Y% / non-renew with justification
→ PM reviews recommendation → adjusts if needed → sends renewal offer
→ Tenant receives offer via portal + email → accepts/counter/declines
→ [If accepted] New lease generated + e-sign → both parties sign → auto-updated in system
→ [If declined] AI generates turnover plan: marketing, make-ready schedule, showing coordination
```

### 7.5 Role-Based Access

| Role | Dashboard View | Key Actions |
|------|---------------|-------------|
| PM | All properties, all tenants, all work orders | Full operational access |
| PM Firm Owner | Portfolio summary, financial performance | Approve distributions, view all reports |
| Accounting | Financial modules, GL, AP/AR | Post entries, reconcile, distribute |
| Maintenance Tech | Work orders assigned to them | Update status, upload photos, request materials |
| Owner | Their properties only | View reports, approve capital expenditures |
| Tenant | Their unit only | Pay rent, submit requests, view lease |
| Vendor | Work orders assigned to them | Accept, schedule, complete, invoice |

---

## 8. Functional Requirements

### Requirement R1: AI Maintenance Triage Engine

- **User story**: As a PM, I want maintenance requests to be automatically categorized, prioritized, and dispatched so that I only handle exceptions, not routine triage.
- **Scenario**: Tenant submits "water leaking under kitchen sink" at 11 PM. AI categorizes as plumbing-urgent, creates work order, dispatches to closest available plumber, and notifies tenant of expected response time.
- **Functional behavior**:
  - Accept requests via web form, mobile app, email, and phone (voicemail transcription).
  - AI model processes text + images to determine: category, urgency (1–4 scale), estimated cost range, recommended vendor.
  - Auto-create work order with all relevant details.
  - Dispatch to vendor via SMS + app notification.
  - Send tenant confirmation with ETA.
  - PM dashboard shows all requests with AI confidence scores; PM can override any decision.
- **Data/field changes**: New `maintenance_request` table with AI-generated fields: `ai_category`, `ai_urgency`, `ai_confidence_score`, `ai_estimated_cost`, `ai_recommended_vendor_id`.
- **Edge cases**:
  - Duplicate submissions: AI detects and merges.
  - Non-English submissions: AI translates and processes.
  - Photo-only submissions (no text): AI processes image-only.
  - Emergency (fire, flood): Bypass AI, immediately call PM + emergency services protocol.
- **Acceptance criteria**:
  - AI correctly categorizes >85% of requests within 6 months of launch.
  - Auto-dispatch succeeds for >70% of routine requests without PM intervention.
  - Tenant receives acknowledgment within 2 minutes of submission.
  - PM can override any AI decision within 1 click.
- **Priority**: P0 (launch critical)

### Requirement R2: AI Owner Report Generation

- **User story**: As a PM, I want monthly owner reports to be auto-generated with AI-written narrative summaries so that I spend minutes instead of days on reporting.
- **Scenario**: On the 1st of each month, Homeflow auto-generates reports for all property owners. Each report includes financial summary, maintenance cost analysis, vacancy status, rent roll, and an AI-written narrative highlighting trends and action items. PM reviews and approves with one click.
- **Functional behavior**:
  - Auto-compile financial data from GL, rent roll, expense ledger, and maintenance logs.
  - Calculate key metrics: NOI, cap rate, delinquency rate, maintenance cost per unit, vacancy rate.
  - AI generates narrative summary: "Occupancy increased 3% this quarter. Maintenance costs rose 12% due to HVAC repairs at Property B — recommend preventive maintenance review. Rent collection improved with delinquency dropping from 8% to 4%."
  - Customizable report templates per owner preference.
  - One-click approval and distribution via email + owner portal.
  - Owner can drill into any line item or ask follow-up questions via portal.
- **Data/field changes**: New `owner_report` table with `ai_narrative` field, `generated_at`, `approved_by`, `distributed_at`.
- **Edge cases**:
  - New property with <1 month data: generate partial report with note.
  - Owner has multiple properties: generate individual + consolidated reports.
  - PM wants to add custom commentary: editable text field above AI narrative.
- **Acceptance criteria**:
  - Report generation completes in <5 minutes for a 200-unit portfolio.
  - AI narrative accurately reflects data trends (verified by PM review in <10% of cases requiring edits).
  - Owner receives report within 24 hours of month-end.
  - Report is exportable as PDF and viewable in owner portal.
- **Priority**: P0 (launch critical)

### Requirement R3: AI Tenant Communication Hub

- **User story**: As a PM, I want AI to handle routine tenant inquiries and recover missed calls so that I focus on high-value interactions.
- **Scenario**: A tenant calls at 2 PM asking "When is my lease up?" AI answers via automated phone system, checks the lease database, and responds: "Your current lease expires on March 31, 2027. Would you like information about renewal?" The tenant's call is logged, and the PM sees a summary in their dashboard.
- **Functional behavior**:
  - AI-powered phone answering: handles routine queries (lease dates, rent balance, maintenance status, payment history), routes complex issues to PM.
  - AI-powered text/email responses: auto-drafts responses to common questions from tenant portal messages.
  - Missed-call recovery: if PM misses a call, AI calls back within 5 minutes, handles routine queries, and escalates if needed.
  - Automated announcements: maintenance updates, policy changes, community events — AI drafts, PM approves.
  - All AI interactions logged in tenant communication history.
- **Data/field changes**: New `ai_communication_log` table with `interaction_type`, `ai_response`, `escalated`, `pm_override`.
- **Edge cases**:
  - Tenant requests to speak to a human: immediately route to PM.
  - AI cannot answer a question: escalate to PM with context summary.
  - Tenant is upset/angry (detected by sentiment analysis): immediately escalate, do not auto-respond.
  - Non-English speaker: AI responds in tenant's preferred language.
- **Acceptance criteria**:
  - AI handles >60% of routine inquiries without PM intervention.
  - Missed-call recovery callback occurs within 5 minutes.
  - Tenant satisfaction with AI interactions >70% (measured by post-interaction survey).
  - PM can review all AI interactions in dashboard.
- **Priority**: P0 (launch critical)

### Requirement R4: Rent Collection & Financial Operations

- **User story**: As a PM, I want tenants to pay rent online automatically, with late fees applied per lease terms and real-time bank reconciliation, so that I eliminate manual rent tracking.
- **Scenario**: Tenant's rent is due on the 1st. On the 1st at 8 AM, tenant receives an automated reminder. Tenant pays via ACH ($1,200). Payment is auto-posted to the ledger. On the 6th, a tenant who hasn't paid receives an automated late notice with the late fee ($50) applied per their lease terms. Bank feed reconciles automatically at end of day.
- **Functional behavior**:
  - Online rent payment via ACH (low fee) and credit/debit card (higher fee, tenant pays).
  - Automated rent reminders (configurable: 3 days before, day of, 1 day after).
  - Auto-apply late fees per lease terms (configurable grace period, fee amount).
  - Real-time bank reconciliation via Plaid integration.
  - Auto-post payments to GL.
  - Owner distributions: auto-calculate management fee, reserve contributions, and net disbursement.
  - Delinquency tracking with automated follow-up sequence (notice → call → pay-or-quit letter).
- **Data/field changes**: Standard accounting tables (transactions, ledger, bank_reconciliation, distributions).
- **Edge cases**:
  - Partial payments: auto-apply per lease terms (late fee first, then rent, or configurable).
  - Payment disputes: flag for PM review, hold posting until resolved.
  - NSF/bounced checks: auto-reverse, apply NSF fee, notify PM.
  - Section 8 / HAP payments: handle split payments (tenant portion + government portion).
- **Acceptance criteria**:
  - Online payment adoption >80% of tenants within 3 months.
  - Bank reconciliation accuracy >99%.
  - Late fee application is 100% consistent with lease terms.
  - Owner distributions process within 2 business days of month-end.
- **Priority**: P0 (launch critical)

### Requirement R5: Tenant Screening & Lease Execution

- **User story**: As a PM, I want tenant screening to be fast, comprehensive, and integrated with lease e-signing so that I can fill vacancies in days, not weeks.
- **Scenario**: A prospective tenant applies online. Within 24 hours, Homeflow returns a screening report: credit score (720), income verification (3.2x rent), eviction history (none), criminal background (clear), and an AI-generated recommendation: "Approve — strong applicant." PM clicks approve, lease is generated from template with pre-filled terms, and the applicant receives a DocuSign link. Lease is executed within 48 hours of application.
- **Functional behavior**:
  - Online application form with consent for screening.
  - Integrated screening via TransUnion/Equifax/Experian: credit, eviction, criminal background.
  - Income verification: bank statement analysis or pay stub upload + AI verification.
  - AI screening recommendation: approve/deny/additional review with justification.
  - Automated adverse action letters if denied (FCRA-compliant).
  - Lease generation from jurisdiction-specific templates with pre-filled terms.
  - E-signature via DocuSign integration.
  - Move-in inspection checklist auto-generated.
- **Data/field changes**: `application` table, `screening_report` table, `lease` table with e-sign status fields.
- **Edge cases**:
  - Applicant with prior eviction: AI flags but does not auto-deny (PM decision).
  - Income verification fails: AI suggests co-signer or additional deposit.
  - Applicant disputes screening result: automated dispute workflow.
  - Lease terms require negotiation: PM can edit before sending.
- **Acceptance criteria**:
  - Screening report delivered within 24 hours of application.
  - Lease execution time <48 hours from application to signed lease.
  - FCRA compliance: 100% of adverse actions include required notices.
  - PM can customize screening criteria per property.
- **Priority**: P0 (launch critical)

### Requirement R6: Compliance Monitoring & Automation

- **User story**: As a PM, I want the system to monitor regulatory changes in my jurisdictions and auto-update lease templates and required disclosures so that I never miss a compliance requirement.
- **Scenario**: The city of Portland passes a new ordinance increasing the maximum security deposit from 1.5x to 1.0x monthly rent. Homeflow detects the change, flags all affected Portland leases, auto-updates the Portland lease template, generates a compliance checklist for existing leases that may need adjustment, and notifies the PM.
- **Functional behavior**:
  - Regulatory database: tracks landlord-tenant laws by jurisdiction (city, county, state).
  - Automated monitoring: detects new ordinances, rule changes, and court rulings.
  - Impact analysis: identifies affected leases, properties, and workflows.
  - Auto-update lease templates for new agreements.
  - Compliance checklist for existing agreements (what needs to change, by when).
  - Auto-generate required disclosures (lead paint, mold, bed bug, etc.) per jurisdiction.
  - Inspection scheduling and tracking (habitability, fire safety, annual inspections).
  - Audit-ready compliance documentation repository.
- **Data/field changes**: `regulation` table, `compliance_checklist` table, `disclosure` table, `inspection` table.
- **Edge cases**:
  - Conflicting laws (city vs. state): AI flags conflict, PM decides.
  - Retroactive compliance requirements: AI identifies affected leases and prioritizes by risk.
  - Multi-jurisdiction PM: separate compliance tracking per jurisdiction.
- **Acceptance criteria**:
  - Regulatory changes detected within 7 days of enactment.
  - Affected leases identified within 24 hours of regulatory update.
  - Lease template updates available within 14 days of regulatory change.
  - Zero compliance violations attributable to missed regulatory changes.
- **Priority**: P1 (launch with, but can be enhanced post-launch)

### Requirement R7: Vendor Management & Marketplace

- **User story**: As a PM, I want a centralized vendor directory with performance tracking and automated dispatch so that I always know which vendor to call and can hold them accountable.
- **Scenario**: A PM needs an HVAC repair. Homeflow shows the top 3 HVAC vendors ranked by: response time (avg 2.1 hours), quality score (4.7/5 from tenant surveys), and cost (avg $180/job). PM dispatches to the top-ranked vendor. Vendor receives SMS + app notification, accepts, completes the job, uploads photos, and submits invoice — all within the platform.
- **Functional behavior**:
  - Vendor directory: contact info, service categories, service areas, insurance certificates.
  - Automated insurance certificate tracking: alert 30 days before expiry, block dispatch if expired.
  - Performance scoring: response time, completion rate, tenant satisfaction, cost per job.
  - Automated dispatch: work order → vendor notification → acceptance → scheduling → completion → invoicing.
  - Vendor payment: auto-generate payment from approved invoice, batch payments weekly.
  - Vendor portal: vendors can update availability, accept/reject jobs, submit invoices.
- **Data/field changes**: `vendor` table, `vendor_performance` table, `vendor_insurance` table, `vendor_payment` table.
- **Edge cases**:
  - Vendor does not respond within SLA: auto-escalate to next vendor.
  - Vendor insurance expires: block dispatch, notify PM.
  - Disputed invoice: hold payment, flag for PM review.
  - Vendor goes inactive: remove from dispatch rotation, notify PM.
- **Acceptance criteria**:
  - Vendor response rate >90% within SLA.
  - Insurance compliance: 100% of dispatched vendors have current insurance.
  - Vendor performance scores updated after every completed job.
  - Vendor payment processed within 5 business days of invoice approval.
- **Priority**: P1 (launch with, marketplace features enhance post-launch)

### Requirement R8: Owner Portal & Approval Workflows

- **User story**: As a property owner, I want a self-service portal where I can view financial reports, approve capital expenditures, and communicate with my PM so that I have visibility without calling for updates.
- **Scenario**: An owner logs in and sees: current month's financial summary, YTD performance vs. budget, vacancy status, and pending approvals (a $3,500 roof repair). The owner reviews the repair request with photos and vendor quote, approves with one click, and the PM is notified to proceed.
- **Functional behavior**:
  - Owner login with property-level access only.
  - Financial dashboard: income, expenses, NOI, delinquency, vacancy.
  - Report library: all historical reports, downloadable as PDF.
  - Approval workflows: capital expenditures, lease terms outside standard, vendor selection for large jobs.
  - Communication: message PM, view communication history.
  - Notifications: email/SMS for report availability, approval requests, critical issues.
- **Data/field changes**: `owner_user` table, `approval_request` table, `owner_notification` table.
- **Edge cases**:
  - Owner with multiple properties: consolidated view + individual property views.
  - Approval timeout: escalate to PM after 48 hours with reminder to owner.
  - Owner revokes approval: notify PM, halt work order.
- **Acceptance criteria**:
  - Owner portal adoption >70% of owners within 3 months.
  - Approval turnaround <24 hours average.
  - Owner satisfaction with portal >4.0/5.
- **Priority**: P0 (launch critical)

### Requirement R9: Tenant Portal & Mobile App

- **User story**: As a tenant, I want a simple app where I can pay rent, submit maintenance requests, view my lease, and communicate with my PM so that everything is in one place.
- **Scenario**: A tenant opens the app, sees their rent balance ($1,200 due in 3 days), taps "Pay Now" with saved ACH, submits a maintenance request with a photo of a leaky faucet, and checks their lease expiry date (March 2027) — all in under 2 minutes.
- **Functional behavior**:
  - Rent payment: ACH, credit/debit, with saved payment methods.
  - Maintenance requests: text + photo + video submission, real-time status tracking.
  - Lease documents: view current lease, past leases, addenda.
  - Communication: message PM, view announcements, receive notifications.
  - Payments history: all past payments with receipts.
  - Community features: announcements, events, policies.
  - Push notifications: rent due, maintenance updates, announcements.
- **Data/field changes**: Standard tenant-facing tables exposed via API to mobile app.
- **Edge cases**:
  - Tenant without bank account: offer money order / check upload option.
  - Tenant with limited English: app supports Spanish, with additional languages post-launch.
  - Shared unit (roommates): split rent payments, individual maintenance requests.
- **Acceptance criteria**:
  - Tenant app adoption >75% within 3 months.
  - App store rating >4.5/5.
  - Rent payment via app >60% of total collections.
  - Maintenance request submission via app >70% of total requests.
- **Priority**: P0 (launch critical)

### Requirement R10: Integrations & Data Import

- **User story**: As a PM migrating from another system, I want to import my existing data and connect my accounting tools so that I can switch without starting from scratch.
- **Scenario**: A PM currently using Buildium exports their tenant roster, lease data, and financial history as CSV files. They upload to Homeflow, which auto-maps fields, validates data, and imports everything within 1 hour. They connect QuickBooks Online for firm-level accounting and Plaid for bank feeds. Within 48 hours, they're fully operational.
- **Functional behavior**:
  - CSV import templates for: tenants, units, leases, owners, vendors, financial history.
  - Auto-mapping: AI matches CSV columns to Homeflow fields.
  - Data validation: flag errors (missing required fields, invalid dates, duplicate records).
  - Import preview: show what will be imported, allow corrections before finalizing.
  - QuickBooks Online integration: sync chart of accounts, journal entries, distributions.
  - Plaid integration: real-time bank feed for reconciliation.
  - DocuSign integration: e-signature for leases and documents.
  - Zillow / Apartments.com syndication: push vacancy listings.
- **Data/field changes**: `import_job` table, `integration` table, `integration_sync_log` table.
- **Edge cases**:
  - Large import (>500 units): batch processing with progress indicator.
  - Conflicting data (duplicate tenants): AI suggests merge, PM confirms.
  - Integration sync failure: retry 3x, then alert PM with error details.
- **Acceptance criteria**:
  - Import completes in <1 hour for <200 units.
  - Auto-mapping accuracy >90% of fields.
  - Zero data loss during import.
  - Integration sync errors resolved within 24 hours.
- **Priority**: P0 (launch critical)

---

## 9. Data and Permission Requirements

### Data Model (Core Entities)

```
Property
  ├── Unit
  │     ├── Tenant (current + historical)
  │     ├── Lease
  │     ├── MaintenanceRequest
  │     └── Inspection
  ├── Owner
  ├── Vendor
  └── Regulation (jurisdiction-linked)

Financial
  ├── Transaction
  ├── LedgerEntry
  ├── BankAccount
  ├── BankReconciliation
  ├── OwnerDistribution
  └── Invoice (vendor)

Communication
  ├── Message (PM ↔ Tenant, PM ↔ Owner, PM ↔ Vendor)
  ├── AICommunicationLog
  └── Announcement

Compliance
  ├── Disclosure
  ├── Inspection
  ├── Regulation
  └── ComplianceChecklist

System
  ├── User (PM, Owner, Tenant, Vendor, Accounting)
  ├── Role
  ├── Permission
  ├── AuditLog
  └── ImportJob
```

### Permission Matrix

| Action | PM | PM Owner | Accounting | Maint. Tech | Owner | Tenant | Vendor |
|--------|----|---------|-----------|-----------|-------|--------|--------|
| View all properties | Yes | Yes | Yes | No | No | No | No |
| View assigned property | — | — | — | Yes | Yes | Yes | Yes |
| View own unit | — | — | — | — | — | Yes | — |
| Create/edit leases | Yes | Yes | No | No | No | No | No |
| Approve leases | Yes | Yes | No | No | No | No | No |
| Post financial entries | Yes | No | Yes | No | No | No | No |
| Approve distributions | No | Yes | No | No | No | No | No |
| Create/approve work orders | Yes | Yes | No | No | No | No | No |
| Update work order status | Yes | Yes | No | Yes | No | No | Yes |
| Submit maintenance request | No | No | No | No | No | Yes | No |
| Pay rent | No | No | No | No | No | Yes | No |
| View financial reports | Yes | Yes | Yes | No | Yes (own) | No | No |
| Approve capital expenditures | No | Yes | No | No | Yes | No | No |
| Manage vendors | Yes | Yes | No | No | No | No | No |
| View audit log | Yes | Yes | No | No | No | No | No |

### Data Security Requirements

- All data encrypted at rest (AES-256) and in transit (TLS 1.3).
- PII (tenant SSN, bank account numbers) encrypted with separate key management.
- PCI DSS compliance for payment processing (via Stripe, not stored locally).
- SOC 2 Type II certification target within 18 months of launch.
- GDPR/CCPA compliance for tenant data (right to deletion, data portability).
- Role-based access control (RBAC) with audit logging for all data access.
- Multi-factor authentication (MFA) required for PM and owner accounts.
- Annual penetration testing by third-party security firm.

---

## 10. Acceptance Criteria

### Happy Path

| Scenario | Acceptance Criteria |
|----------|-------------------|
| PM onboards a new 85-unit portfolio | All tenants, units, leases, and owners imported within 48 hours. First rent collection and maintenance request processed successfully. |
| AI triages a routine maintenance request | Request categorized correctly, work order created, vendor dispatched, tenant notified — all within 5 minutes, without PM intervention. |
| Monthly owner report generated | Report auto-generated within 5 minutes, AI narrative accurately reflects data, PM approves and distributes within 10 minutes total. |
| Tenant pays rent online | Payment processed via ACH within 2 business days, auto-posted to ledger, bank reconciliation matches. |
| Lease renewal executed | AI recommendation generated 60 days before expiry, renewal offer sent, lease e-signed — all within 48 hours of PM approval. |

### Error Path

| Scenario | Acceptance Criteria |
|----------|-------------------|
| AI mis-categorizes a maintenance request | PM can override categorization within 1 click. Original AI decision logged for model improvement. |
| Bank reconciliation mismatch | System flags discrepancy, provides side-by-side comparison, PM can manually reconcile or flag for investigation. |
| Vendor does not respond to work order | Auto-escalate to backup vendor within SLA. PM notified of escalation. Original vendor performance score adjusted. |
| Tenant payment fails (NSF) | Auto-reverse payment, apply NSF fee per lease terms, notify PM and tenant, initiate retry sequence. |
| Integration sync failure | Retry 3 times with exponential backoff. Alert PM after final failure with error details and manual resolution path. |

### Permission / Edge Path

| Scenario | Acceptance Criteria |
|----------|-------------------|
| Owner tries to access another owner's property | Access denied. Audit log records attempt. Owner sees only their properties. |
| Tenant tries to submit maintenance for another unit | System validates unit-tenant relationship. Request rejected with explanation. |
| PM account accessed from new device | MFA challenge triggered. If MFA not set up, force setup before access granted. |
| Accounting user tries to approve a lease | Access denied. Only PM and PM Owner roles can approve leases. |

### Data Consistency Path

| Scenario | Acceptance Criteria |
|----------|-------------------|
| Lease modified after financial entries posted | System warns of impact on financial data. PM confirms. Audit log records change with before/after values. |
| Tenant moved to different unit | All active leases, maintenance requests, and communication history transferred. Old unit marked vacant. Financial entries remain linked to original unit. |
| Vendor deleted from system | Cannot delete if vendor has active work orders or unpaid invoices. System prompts to deactivate instead. |

---

## 11. Rollout and Changelog Notes

### Rollout Strategy

| Phase | Timeline | Scope | Success Criteria |
|-------|----------|-------|-----------------|
| **Alpha** | Month 1–3 | 10 PM firms (50–100 units each), single region | Core workflows functional, <5 critical bugs, NPS >30 |
| **Beta** | Month 4–6 | 50 PM firms (20–200 units each), 3 regions | AI triage accuracy >75%, owner report generation <10 min, churn <5% |
| **General Availability** | Month 7–9 | Open to all, national | AI triage accuracy >85%, tenant app rating >4.5, NPS >50 |
| **Scale** | Month 10–12 | Marketing push, partnership channels | 500+ PM firms, 50K+ units, churn <2% |

### Migration Path

- **From spreadsheets**: Guided import wizard, template downloads, data validation, 48-hour onboarding.
- **From Buildium/Yardi Breeze/DoorLoop**: CSV export guides for each platform, auto-mapping, data validation.
- **From Yardi Voyager/MRI**: Dedicated migration specialist for larger PMs (100–200 units), custom data mapping.

### Changelog Notes (v1.0 Launch)

> **Homeflow v1.0 — AI-Native Property Management for the Missing Middle**
>
> We built Homeflow for property managers managing 20–200 units who are stuck between expensive enterprise tools and basic landlord apps.
>
> **What's new**:
> - AI Maintenance Triage: Auto-categorize, prioritize, and dispatch maintenance requests.
> - AI Owner Reports: Auto-generated monthly reports with AI-written narrative summaries.
> - AI Tenant Communication: AI-powered phone answering and missed-call recovery.
> - Smart Rent Collection: Online payments, auto-late fees, bank reconciliation.
> - Lease Management: E-signing, AI renewal recommendations, compliance tracking.
> - Owner Portal: Self-service financial reports and approval workflows.
> - Tenant App: Pay rent, submit requests, track maintenance, view lease.
> - Vendor Management: Directory, performance scoring, automated dispatch.
> - Compliance Monitoring: Jurisdiction-aware regulatory tracking and auto-updates.
> - Integrations: QuickBooks, Stripe, Plaid, DocuSign, Zillow.

---

## 12. Risks and Open Questions

### Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **AI accuracy below threshold** — Maintenance triage or owner report narratives are inaccurate, eroding trust. | High | Medium | Start with human-in-the-loop (PM approves all AI outputs). Gradually increase auto-dispatch as accuracy improves. Clear confidence thresholds with PM override. |
| **Slow adoption by older PMs** — Target demographic may resist new technology. | Medium | Medium | Invest in onboarding concierge (human-assisted for first 30 days). Simple UX design. Phone support. Video tutorials. |
| **Competitive response** — AppFolio or DoorLoop adds similar AI features. | High | High | Speed to market. AI-native architecture is fundamentally different from bolt-on features. Build proprietary data moat (maintenance patterns, financial templates). Move fast on AI innovation. |
| **Payment processing dependency** — Stripe outage or policy change disrupts rent collection. | High | Low | Multi-provider strategy (Stripe + backup). Offline payment tracking. Clear communication during outages. |
| **Regulatory compliance gaps** — Miss a jurisdiction-specific regulation, leading to PM liability. | High | Medium | Dedicated compliance team. Legal review of all regulatory updates. Insurance/E&O coverage. Clear disclaimers that PM is responsible for final compliance. |
| **Data migration failures** — PMs lose data during import from legacy systems. | Medium | Medium | Extensive testing per source platform. Data validation before final import. Rollback capability. Dedicated migration support for larger PMs. |
| **Tenant app adoption** — Tenants don't download or use the app, reducing AI effectiveness. | Medium | Medium | Incentivize adoption (lower payment fees via app). QR codes at property. PM-driven onboarding. SMS fallback for non-app users. |

### Open Questions

| Question | Owner | Decision Needed By | Impact |
|----------|-------|--------------------|--------|
| Should we build our own tenant screening data pipeline or rely entirely on third-party bureaus? | Product + Engineering | Before Beta | Cost, speed, differentiation |
| What is the pricing model — per unit, per property, or tiered? | Product + Business | Before Alpha | Revenue, competitive positioning |
| Should we offer a freemium tier for <20 units to drive adoption? | Product + Business | Before Beta | Growth strategy, unit economics |
| How do we handle PM firms that manage properties in 10+ states with different compliance requirements? | Product + Legal | Before GA | Product complexity, compliance risk |
| Should we build a mobile app for PMs (not just tenants) or keep PM experience web-only? | Product + Engineering | Before Beta | Development cost, user experience |
| What is the AI model training strategy — build proprietary models or use foundation models with fine-tuning? | Engineering | Before Alpha | Cost, accuracy, defensibility |
| Should we pursue SOC 2 before GA or defer to post-launch? | Engineering + Security | Before Beta | Enterprise sales readiness, cost |

---

*PRD prepared by pm-bajaji. For questions, clarifications, or to request design/engineering review, contact the product team.*
