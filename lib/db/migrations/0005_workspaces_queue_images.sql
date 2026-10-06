-- Multi-user workspaces: a profile's workspace_id points at the tenant owner's profile id.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "workspace_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'owner';--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "avatar_url" text;--> statement-breakpoint
UPDATE "profiles" SET "workspace_id" = "id" WHERE "workspace_id" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_workspace_idx" ON "profiles" ("workspace_id");--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "avatar_url" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" text NOT NULL DEFAULT 'pending',
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 5,
  "run_at" timestamptz NOT NULL DEFAULT now(),
  "locked_at" timestamptz,
  "last_error" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_status_run_idx" ON "jobs" ("status", "run_at");
