ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "website_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "lead_capture_token" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "lead_capture_enabled" boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "business_prefs" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "goals" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "notification_prefs" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_lead_capture_token_unique" ON "profiles" ("lead_capture_token");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "lead_id" uuid REFERENCES "leads"("id") ON DELETE CASCADE,
  "deal_id" uuid REFERENCES "deals"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "notes" text,
  "type" text NOT NULL DEFAULT 'follow_up',
  "priority" text NOT NULL DEFAULT 'normal',
  "due_at" timestamptz NOT NULL,
  "completed" boolean NOT NULL DEFAULT false,
  "completed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_agent_due_idx" ON "tasks" ("agent_id", "due_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_lead_idx" ON "tasks" ("lead_id");--> statement-breakpoint
UPDATE "profiles" SET "lead_capture_token" = md5(random()::text || "id") WHERE "lead_capture_token" IS NULL;
