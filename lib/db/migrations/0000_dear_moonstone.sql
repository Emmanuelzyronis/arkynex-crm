CREATE TABLE "ai_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"action_type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"priority" text NOT NULL,
	"lead_id" uuid,
	"deal_id" uuid,
	"suggested_message" text,
	"generated_date" date DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"agent_id" text NOT NULL,
	"channel" text NOT NULL,
	"direction" text,
	"content" text,
	"call_outcome" text,
	"duration_seconds" integer,
	"wa_status" text,
	"whatsapp_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"amount" double precision NOT NULL,
	"offered_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"lead_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"asking_price" double precision NOT NULL,
	"agreed_price" double precision,
	"commission_rate" double precision DEFAULT 0.05 NOT NULL,
	"commission_amount" double precision,
	"agency_cut_pct" double precision,
	"agent_net_commission" double precision,
	"co_agent_id" text,
	"co_agent_split_pct" double precision,
	"closing_probability" double precision,
	"expected_close_date" date,
	"status" text DEFAULT 'negotiating' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"agent_id" text NOT NULL,
	"from_stage" text,
	"to_stage" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"company" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"property_type" text,
	"bedrooms" integer,
	"budget_min" double precision,
	"budget_max" double precision,
	"location_prefs" text[],
	"timeline" text,
	"notes" text,
	"stage" text DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"stage_entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_contacted_at" timestamp with time zone,
	"raw_intake_text" text,
	"embedding" text,
	"referred_by_lead_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"agency_name" text,
	"timezone" text DEFAULT 'Africa/Lagos' NOT NULL,
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"onboarded_at" timestamp with time zone,
	"whatsapp_phone" text,
	"whatsapp_verified_at" timestamp with time zone,
	"whatsapp_pairing_code" text,
	"whatsapp_pairing_expires" timestamp with time zone,
	"tier" text DEFAULT 'starter' NOT NULL,
	"subscription_status" text DEFAULT 'trialing' NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"paystack_customer_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"title" text NOT NULL,
	"property_type" text NOT NULL,
	"price" double precision NOT NULL,
	"city" text DEFAULT 'Lagos' NOT NULL,
	"area" text,
	"address" text,
	"description" text,
	"bedrooms" integer,
	"bathrooms" integer,
	"size_sqm" double precision,
	"condition" text,
	"furnishing" text,
	"amenities" text[],
	"status" text DEFAULT 'active' NOT NULL,
	"ownership" text DEFAULT 'own' NOT NULL,
	"commission_split_pct" double precision,
	"external_agent_name" text,
	"external_agent_phone" text,
	"latitude" double precision,
	"longitude" double precision,
	"inquiry_count" integer DEFAULT 0 NOT NULL,
	"viewing_count" integer DEFAULT 0 NOT NULL,
	"embedding" text,
	"listed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"doc_type" text NOT NULL,
	"storage_path" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"paystack_subscription_code" text,
	"paystack_plan_code" text,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "viewings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"lead_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"lead_reaction" text,
	"rating" integer,
	"agent_notes" text,
	"reminder_sent_at" timestamp with time zone,
	"follow_up_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"event_type" text,
	"payload" jsonb,
	"processed" boolean DEFAULT false NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_offers" ADD CONSTRAINT "deal_offers_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_co_agent_id_profiles_id_fk" FOREIGN KEY ("co_agent_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_photos" ADD CONSTRAINT "property_photos_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_agent_id_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_actions_agent_created_idx" ON "ai_actions" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX "communications_lead_created_idx" ON "communications" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "deals_agent_created_idx" ON "deals" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_agent_phone_unique" ON "leads" USING btree ("agent_id","phone");--> statement-breakpoint
CREATE INDEX "leads_agent_stage_idx" ON "leads" USING btree ("agent_id","stage");--> statement-breakpoint
CREATE INDEX "leads_agent_created_idx" ON "leads" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX "properties_agent_listed_idx" ON "properties" USING btree ("agent_id","listed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_paystack_code_unique" ON "subscriptions" USING btree ("paystack_subscription_code");--> statement-breakpoint
CREATE INDEX "viewings_agent_scheduled_idx" ON "viewings" USING btree ("agent_id","scheduled_at");