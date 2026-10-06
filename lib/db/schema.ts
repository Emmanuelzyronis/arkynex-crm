import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const profiles = pgTable(
  "profiles",
  {
  id: text("id").primaryKey(),
  /** Tenant id. Owners point at their own id; team members at their owner's id. */
  workspaceId: text("workspace_id"),
  /** owner | admin | agent */
  role: text("role").notNull().default("owner"),
  avatarUrl: text("avatar_url"),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  agencyName: text("agency_name"),
  timezone: text("timezone").notNull().default("UTC"),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  tier: text("tier").notNull().default("starter"),
  subscriptionStatus: text("subscription_status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  websiteUrl: text("website_url"),
  leadCaptureToken: text("lead_capture_token").unique(),
  leadCaptureEnabled: boolean("lead_capture_enabled").notNull().default(true),
  businessPrefs: jsonb("business_prefs"),
  goals: jsonb("goals"),
  notificationPrefs: jsonb("notification_prefs"),
  leadRoutingEnabled: boolean("lead_routing_enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  },
  (table) => [index("profiles_workspace_idx").on(table.workspaceId)],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    userId: text("user_id"),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    role: text("role").notNull().default("agent"),
    avatarUrl: text("avatar_url"),
    status: text("status").notNull().default("active"),
    invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("team_members_owner_email_unique").on(table.ownerId, table.email),
    index("team_members_owner_idx").on(table.ownerId),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    company: text("company"),
    source: text("source").notNull().default("manual"),
    propertyType: text("property_type"),
    bedrooms: integer("bedrooms"),
    budgetMin: doublePrecision("budget_min"),
    budgetMax: doublePrecision("budget_max"),
    locationPrefs: text("location_prefs").array(),
    timeline: text("timeline"),
    notes: text("notes"),
    stage: text("stage").notNull().default("new"),
    score: integer("score").notNull().default(0),
    archived: boolean("archived").notNull().default(false),
    stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    rawIntakeText: text("raw_intake_text"),
    embedding: text("embedding"),
    referredByLeadId: uuid("referred_by_lead_id"),
    assignedToId: uuid("assigned_to_id").references(() => teamMembers.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("leads_agent_phone_unique").on(table.agentId, table.phone),
    index("leads_agent_stage_idx").on(table.agentId, table.stage),
    index("leads_agent_created_idx").on(table.agentId, table.createdAt),
    index("leads_assigned_idx").on(table.agentId, table.assignedToId),
  ],
);

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    propertyType: text("property_type").notNull(),
    price: doublePrecision("price").notNull(),
    city: text("city").notNull().default("New York"),
    area: text("area"),
    address: text("address"),
    description: text("description"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    sizeSqm: doublePrecision("size_sqm"),
    condition: text("condition"),
    furnishing: text("furnishing"),
    amenities: text("amenities").array(),
    status: text("status").notNull().default("active"),
    ownership: text("ownership").notNull().default("own"),
    imageUrl: text("image_url"),
    commissionSplitPct: doublePrecision("commission_split_pct"),
    externalAgentName: text("external_agent_name"),
    externalAgentPhone: text("external_agent_phone"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    inquiryCount: integer("inquiry_count").notNull().default(0),
    viewingCount: integer("viewing_count").notNull().default(0),
    embedding: text("embedding"),
    listedAt: timestamp("listed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("properties_agent_listed_idx").on(table.agentId, table.listedAt),
  ],
);

export const propertyPhotos = pgTable("property_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const propertyDocuments = pgTable("property_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  docType: text("doc_type").notNull(),
  storagePath: text("storage_path").notNull(),
  label: text("label"),
  createdAt: createdAt(),
});

export const viewings = pgTable(
  "viewings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("scheduled"),
    leadReaction: text("lead_reaction"),
    rating: integer("rating"),
    agentNotes: text("agent_notes"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    followUpSentAt: timestamp("follow_up_sent_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("viewings_agent_scheduled_idx").on(table.agentId, table.scheduledAt),
  ],
);

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    askingPrice: doublePrecision("asking_price").notNull(),
    agreedPrice: doublePrecision("agreed_price"),
    commissionRate: doublePrecision("commission_rate").notNull().default(0.05),
    commissionAmount: doublePrecision("commission_amount"),
    agencyCutPct: doublePrecision("agency_cut_pct"),
    agentNetCommission: doublePrecision("agent_net_commission"),
    coAgentId: text("co_agent_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    coAgentSplitPct: doublePrecision("co_agent_split_pct"),
    closingProbability: doublePrecision("closing_probability"),
    expectedCloseDate: date("expected_close_date"),
    status: text("status").notNull().default("negotiating"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("deals_agent_created_idx").on(table.agentId, table.createdAt)],
);

export const dealOffers = pgTable("deal_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount").notNull(),
  offeredBy: text("offered_by").notNull(),
  notes: text("notes"),
  createdAt: createdAt(),
});

export const leadStageHistory = pgTable("lead_stage_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  fromStage: text("from_stage"),
  toStage: text("to_stage").notNull(),
  notes: text("notes"),
  createdAt: createdAt(),
});

export const communications = pgTable(
  "communications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    direction: text("direction"),
    content: text("content"),
    callOutcome: text("call_outcome"),
    durationSeconds: integer("duration_seconds"),
    createdAt: createdAt(),
  },
  (table) => [
    index("communications_lead_created_idx").on(table.leadId, table.createdAt),
  ],
);

export const aiActions = pgTable(
  "ai_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    actionType: text("action_type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    priority: text("priority").notNull(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
    suggestedMessage: text("suggested_message"),
    generatedDate: date("generated_date").notNull().defaultNow(),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    dismissed: boolean("dismissed").notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [index("ai_actions_agent_created_idx").on(table.agentId, table.createdAt)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    notes: text("notes"),
    type: text("type").notNull().default("follow_up"),
    priority: text("priority").notNull().default("normal"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("tasks_agent_due_idx").on(table.agentId, table.dueAt),
    index("tasks_lead_idx").on(table.leadId),
  ],
);

export const smartLists = pgTable(
  "smart_lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon"),
    filters: jsonb("filters").notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("smart_lists_agent_idx").on(table.agentId, table.sortOrder)],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    plan: text("plan").notNull(),
    status: text("status").notNull(),
    clerkSubscriptionId: text("clerk_subscription_id"),
    clerkPlanId: text("clerk_plan_id"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("subscriptions_clerk_subscription_unique").on(
      table.clerkSubscriptionId,
    ),
  ],
);

export const webhookLogs = pgTable("webhook_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  eventType: text("event_type"),
  payload: jsonb("payload"),
  processed: boolean("processed").notNull().default(false),
  error: text("error"),
  createdAt: createdAt(),
});

/**
 * Durable background job queue (cron-drained).
 *
 * Vercel Cron triggers `/api/cron/process-jobs`, which claims batches with
 * `FOR UPDATE SKIP LOCKED`, runs them and retries with backoff. This extends the
 * deployment beyond "cron only" without adding a broker dependency.
 */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("jobs_status_run_idx").on(table.status, table.runAt)],
);

export type Profile = typeof profiles.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type PropertyPhoto = typeof propertyPhotos.$inferSelect;
export type PropertyDocument = typeof propertyDocuments.$inferSelect;
export type Viewing = typeof viewings.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type DealOffer = typeof dealOffers.$inferSelect;
export type LeadStageHistory = typeof leadStageHistory.$inferSelect;
export type Communication = typeof communications.$inferSelect;
export type AiAction = typeof aiActions.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type SmartList = typeof smartLists.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type Job = typeof jobs.$inferSelect;
