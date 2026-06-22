// supabase/functions/score-lead/index.ts
// Called automatically after a lead is created or updated via a Supabase Database Webhook.
// Also callable manually: POST /functions/v1/score-lead  { "leadId": "<uuid>" }
//
// Deploy:
//   npx supabase functions deploy score-lead --no-verify-jwt
//
// Webhook setup (one-time in Supabase Dashboard → Database → Webhooks):
//   Table: leads
//   Events: INSERT, UPDATE
//   HTTP URL: https://ymlnxbsqnfgjhhjsuzql.supabase.co/functions/v1/score-lead
//   HTTP Headers: Authorization: Bearer <SERVICE_ROLE_KEY>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Scoring weights (must sum to 100) ───────────────────────────────────────

const WEIGHTS = {
  /** How complete the lead's requirement profile is (all fields filled). */
  completeness: 25,
  /** Timeline urgency — "immediately" scores highest. */
  timeline: 20,
  /** Budget quality — higher absolute budget = higher score. */
  budget: 20,
  /** Source quality — WhatsApp and referral convert best. */
  source: 15,
  /** Stage progression — further along = higher score. */
  stage: 10,
  /** Recency — leads captured recently score higher. */
  recency: 10,
};

// ─── Sub-scorers ─────────────────────────────────────────────────────────────

function scoreCompleteness(lead: Record<string, unknown>): number {
  const fields = [
    lead.full_name,
    lead.phone,
    lead.email,
    lead.property_type,
    lead.bedrooms,
    lead.budget_min,
    lead.budget_max,
    lead.location_prefs &&
      Array.isArray(lead.location_prefs) &&
      lead.location_prefs.length > 0,
    lead.timeline,
    lead.notes,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * WEIGHTS.completeness);
}

function scoreTimeline(timeline: string | null): number {
  const map: Record<string, number> = {
    immediately: 1.0,
    "1_month": 0.8,
    "3_months": 0.6,
    "6_months": 0.35,
    just_looking: 0.1,
  };
  return Math.round((map[timeline ?? ""] ?? 0.5) * WEIGHTS.timeline);
}

function scoreBudget(budgetMax: number | null, budgetMin: number | null): number {
  const budget = budgetMax ?? budgetMin ?? 0;
  // Score on a log scale — ₦500k min, ₦2B+ gets full score
  if (budget <= 0) return 0;
  const logScore = Math.min(
    1,
    Math.max(0, (Math.log10(budget) - 5.7) / (9.3 - 5.7)), // 500k to 2B
  );
  return Math.round(logScore * WEIGHTS.budget);
}

function scoreSource(source: string | null): number {
  const map: Record<string, number> = {
    referral: 1.0,
    whatsapp: 0.9,
    web_widget: 0.75,
    social_dm: 0.65,
    business_card: 0.6,
    manual: 0.5,
  };
  return Math.round((map[source ?? ""] ?? 0.5) * WEIGHTS.source);
}

function scoreStage(stage: string | null): number {
  const order: Record<string, number> = {
    new: 0,
    contacted: 0.25,
    viewing_scheduled: 0.5,
    viewed: 0.65,
    negotiating: 0.85,
    offer_made: 0.95,
    closed: 1.0,
    lost: 0,
  };
  return Math.round((order[stage ?? "new"] ?? 0) * WEIGHTS.stage);
}

function scoreRecency(createdAt: string | null): number {
  if (!createdAt) return 0;
  const daysOld = Math.max(
    0,
    (Date.now() - new Date(createdAt).getTime()) / 86400000,
  );
  // Full score within 7 days, decays to 0 at 90 days
  const decay = Math.max(0, 1 - daysOld / 90);
  return Math.round(decay * WEIGHTS.recency);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let leadId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));

    // Database Webhook payload: { type: "INSERT"|"UPDATE", record: { id: ... } }
    if (body.record?.id) {
      leadId = body.record.id;
    } else if (body.leadId) {
      // Manual call
      leadId = body.leadId;
    }

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: "leadId is required" }),
        { status: 400 },
      );
    }

    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404 },
      );
    }

    const score = Math.min(
      100,
      scoreCompleteness(lead) +
        scoreTimeline(lead.timeline) +
        scoreBudget(lead.budget_max, lead.budget_min) +
        scoreSource(lead.source) +
        scoreStage(lead.stage) +
        scoreRecency(lead.created_at),
    );

    const { error: updateError } = await supabase
      .from("leads")
      .update({ score })
      .eq("id", leadId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500 },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        score,
        breakdown: {
          completeness: scoreCompleteness(lead),
          timeline: scoreTimeline(lead.timeline),
          budget: scoreBudget(lead.budget_max, lead.budget_min),
          source: scoreSource(lead.source),
          stage: scoreStage(lead.stage),
          recency: scoreRecency(lead.created_at),
        },
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err), leadId }),
      { status: 500 },
    );
  }
});
