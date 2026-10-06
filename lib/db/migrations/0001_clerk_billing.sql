ALTER TABLE "profiles" DROP COLUMN IF EXISTS "paystack_customer_code";--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "paystack_subscription_code" TO "clerk_subscription_id";--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "paystack_plan_code" TO "clerk_plan_id";--> statement-breakpoint
ALTER INDEX IF EXISTS "subscriptions_paystack_code_unique" RENAME TO "subscriptions_clerk_subscription_unique";
