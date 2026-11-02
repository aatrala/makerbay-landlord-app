CREATE TYPE "public"."booking_source" AS ENUM('direct', 'airbnb', 'booking_com', 'vrbo', 'other');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('tentative', 'confirmed', 'blocked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."guest_message_status" AS ENUM('draft', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."turnover_status" AS ENUM('pending', 'assigned', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TABLE "booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"guest_id" uuid,
	"calendar_feed_id" uuid,
	"source" "booking_source" DEFAULT 'direct' NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"num_guests" integer,
	"accommodation_total" real DEFAULT 0 NOT NULL,
	"cleaning_fee" real DEFAULT 0 NOT NULL,
	"platform_fee" real DEFAULT 0 NOT NULL,
	"taxes" real DEFAULT 0 NOT NULL,
	"external_uid" text,
	"summary" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"source" "booking_source" NOT NULL,
	"url" text NOT NULL,
	"last_synced_at" timestamp,
	"last_status" text,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text,
	"phone" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"booking_id" uuid,
	"template_id" uuid,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" "guest_message_status" DEFAULT 'draft' NOT NULL,
	"error" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homeowner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"management_fee_pct" real DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"property_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"homeowner_id" uuid,
	"name" text NOT NULL,
	"nightly_rate" real NOT NULL,
	"min_stay" integer DEFAULT 1 NOT NULL,
	"cleaning_fee" real DEFAULT 0 NOT NULL,
	"max_guests" integer,
	"house_rules" text,
	"check_in_time" text DEFAULT '15:00' NOT NULL,
	"check_out_time" text DEFAULT '10:00' NOT NULL,
	"check_in_instructions" text,
	"management_fee_pct" real,
	"ical_token" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turnover_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"booking_id" uuid,
	"vendor_id" uuid,
	"due_date" date NOT NULL,
	"next_check_in" date,
	"status" "turnover_status" DEFAULT 'pending' NOT NULL,
	"cost" real,
	"notes" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_calendar_feed_id_calendar_feed_id_fk" FOREIGN KEY ("calendar_feed_id") REFERENCES "public"."calendar_feed"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_feed" ADD CONSTRAINT "calendar_feed_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest" ADD CONSTRAINT "guest_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_message" ADD CONSTRAINT "guest_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_message" ADD CONSTRAINT "guest_message_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_message" ADD CONSTRAINT "guest_message_template_id_message_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homeowner" ADD CONSTRAINT "homeowner_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_homeowner_id_homeowner_id_fk" FOREIGN KEY ("homeowner_id") REFERENCES "public"."homeowner"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_template" ADD CONSTRAINT "message_template_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnover_task" ADD CONSTRAINT "turnover_task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnover_task" ADD CONSTRAINT "turnover_task_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnover_task" ADD CONSTRAINT "turnover_task_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnover_task" ADD CONSTRAINT "turnover_task_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_listing_uid_unique" ON "booking" USING btree ("listing_id","external_uid");--> statement-breakpoint
CREATE INDEX "booking_listing_dates_idx" ON "booking" USING btree ("listing_id","check_in","check_out");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_unit_unique" ON "listing" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_ical_token_unique" ON "listing" USING btree ("ical_token");--> statement-breakpoint
CREATE UNIQUE INDEX "turnover_booking_unique" ON "turnover_task" USING btree ("booking_id");