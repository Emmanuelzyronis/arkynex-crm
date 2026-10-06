ALTER TABLE "profiles" DROP COLUMN IF EXISTS "whatsapp_phone";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "whatsapp_verified_at";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "whatsapp_pairing_code";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "whatsapp_pairing_expires";--> statement-breakpoint
ALTER TABLE "communications" DROP COLUMN IF EXISTS "wa_status";--> statement-breakpoint
ALTER TABLE "communications" DROP COLUMN IF EXISTS "whatsapp_message_id";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "timezone" SET DEFAULT 'UTC';--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "city" SET DEFAULT 'New York';
