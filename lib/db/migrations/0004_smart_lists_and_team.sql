ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "lead_routing_enabled" boolean NOT NULL DEFAULT false;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "user_id" text,
  "email" text NOT NULL,
  "full_name" text NOT NULL,
  "role" text NOT NULL DEFAULT 'agent',
  "status" text NOT NULL DEFAULT 'active',
  "invited_at" timestamptz NOT NULL DEFAULT now(),
  "joined_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_owner_email_unique" ON "team_members" ("owner_id", "email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_members_owner_idx" ON "team_members" ("owner_id");--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "assigned_to_id" uuid REFERENCES "team_members"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_assigned_idx" ON "leads" ("agent_id", "assigned_to_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "smart_lists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "icon" text,
  "filters" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smart_lists_agent_idx" ON "smart_lists" ("agent_id", "sort_order");
