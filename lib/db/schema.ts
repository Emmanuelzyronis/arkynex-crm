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

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  agencyName: text("agency_name"),
  timezone: text("timezone").notNull().default("Africa/Lagos"),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  whatsappPhone: text("whatsapp_phone"),
  whatsappVerifiedAt: timestamp("whatsapp_verified_at", { withTimezone: true }),
  whatsappPairingCode: text("whatsapp_pairing_code"),
  whatsappPairingExpires: timestamp("whatsapp_pairing_expires", {
    withTimezone: true,
  }),
  tier: text("tier").notNull().default("starter"),
  subscriptionStatus: text("subscription_status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  paystackCustomerCode: text("paystack_customer_code"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

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
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("leads_agent_phone_unique").on(table.agentId, table.phone),
    index("leads_agent_stage_idx").on(table.agentId, table.stage),
    index("leads_agent_created_idx").on(table.agentId, table.createdAt),
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
    city: text("city").notNull().default("Lagos"),
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
    waStatus: text("wa_status"),
    whatsappMessageId: text("whatsapp_message_id"),
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

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    plan: text("plan").notNull(),
    status: text("status").notNull(),
    paystackSubscriptionCode: text("paystack_subscription_code"),
    paystackPlanCode: text("paystack_plan_code"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("subscriptions_paystack_code_unique").on(
      table.paystackSubscriptionCode,
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
export type Subscription = typeof subscriptions.$inferSelect;
export type WebhookLog = typeof webhookLogs.$inferSelect;
