CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('advertising', 'auto_travel', 'cleaning', 'insurance', 'legal_professional', 'management', 'mortgage_interest', 'other_interest', 'repairs', 'supplies', 'taxes', 'utilities', 'depreciation', 'other');--> statement-breakpoint
CREATE TYPE "public"."lease_status" AS ENUM('active', 'expired', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."maintenance_priority" AS ENUM('emergency', 'urgent', 'routine');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('submitted', 'acknowledged', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'sms', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('lease_renewal', 'rent_reminder', 'late_rent', 'maintenance_update', 'rent_increase', 'inspection', 'custom');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'check', 'zelle', 'venmo', 'ach', 'card', 'bank_transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'received', 'late', 'partial');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('starter', 'growth', 'pro', 'portfolio');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('active', 'vacant', 'under_renovation');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('single_family', 'duplex', 'multifamily', 'condo', 'townhouse');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency" AS ENUM('monthly', 'quarterly', 'annually');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."unit_status" AS ENUM('occupied', 'vacant', 'under_renovation');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"unit_id" uuid,
	"category" "expense_category" NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"date" date NOT NULL,
	"vendor" text,
	"receipt_url" text,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_frequency" "recurring_frequency",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lease" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"rent_amount" real NOT NULL,
	"deposit" real,
	"terms" text,
	"document_url" text,
	"status" "lease_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"tenant_id" uuid,
	"property_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" "maintenance_priority" DEFAULT 'routine' NOT NULL,
	"status" "maintenance_status" DEFAULT 'submitted' NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completion_photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"vendor_id" uuid,
	"cost" real,
	"ai_category" text,
	"ai_priority" text,
	"ai_confidence" real,
	"ai_estimated_cost" real,
	"ai_recommended_vendor_id" uuid,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"recipient" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"amount" real NOT NULL,
	"amount_paid" real DEFAULT 0 NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"method" "payment_method",
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"late_fee" real DEFAULT 0 NOT NULL,
	"notes" text,
	"matched_transaction_id" text,
	"stripe_payment_intent_id" text,
	"stripe_client_secret" text,
	"stripe_payment_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"type" "property_type" NOT NULL,
	"unit_count" integer DEFAULT 1 NOT NULL,
	"status" "property_status" DEFAULT 'active' NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan" "plan_tier" DEFAULT 'starter' NOT NULL,
	"billing_cycle" "billing_cycle" DEFAULT 'monthly' NOT NULL,
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"trial_ends_at" timestamp,
	"current_period_end" timestamp NOT NULL,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tenant_user_id" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"employer" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"unit_number" text NOT NULL,
	"rent_amount" real NOT NULL,
	"status" "unit_status" DEFAULT 'vacant' NOT NULL,
	"bedrooms" integer,
	"bathrooms" real,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"trade" text NOT NULL,
	"phone" text,
	"email" text,
	"insurance_expiry" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease" ADD CONSTRAINT "lease_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease" ADD CONSTRAINT "lease_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_request" ADD CONSTRAINT "maintenance_request_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_request" ADD CONSTRAINT "maintenance_request_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_request" ADD CONSTRAINT "maintenance_request_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_request" ADD CONSTRAINT "maintenance_request_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_request" ADD CONSTRAINT "maintenance_request_ai_recommended_vendor_id_vendor_id_fk" FOREIGN KEY ("ai_recommended_vendor_id") REFERENCES "public"."vendor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property" ADD CONSTRAINT "property_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_tenant_user_id_user_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit" ADD CONSTRAINT "unit_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;