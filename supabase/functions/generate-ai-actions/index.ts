// supabase/functions/generate-ai-actions/index.ts
// Deployed as a Supabase Edge Function.
// Schedule: nightly at 01:00 WAT (00:00 UTC) via pg_cron or the Supabase cron UI.
//
// Deploy:
//   npx supabase functions deploy generate-ai-actions --no-verify-jwt
//
// Schedule (run once in SQL Editor):
//   select cron.schedule('nightly-ai-actions', '0 0 * * *',
//     $$select net.http_post(
//       url := 'https://ymlnxbsqnfgjhhjsuzql.supabase.co/functions/v1/generate-ai-actions',
//       headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
//       body := '{}'::jsonb
//     )$$
//   );

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STALE_LEAD_DAYS = 5;
const DEAL_PROBABILITY_DROP_THRESHOLD = 0.3;

Deno.serve(async (req: Request) => {
  // Only allow POST (from cron or manual trigger)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const today = new Date().toISOString().split("T")[0];
  let totalCreated = 0;
  const errors: string[] = [];

  try {
    // Get all agent IDs from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("subscription_status", "active")
      .or("subscription_status.eq.trialing");

    if (profilesError) throw profilesError;

    for (const { id: agentId } of profiles ?? []) {
      const actions: Record<string, unknown>[] = [];

      // ──────────────────────────────────────────────────
      // 1. STALE LEADS — haven't been contacted in N days
      // ──────────────────────────────────────────────────
      const staleThreshold = new Date();
      staleThreshold.setDate(staleThreshold.getDate() - STALE_LEAD_DAYS);

      const { data: staleLeads } = await supabase
        .from("leads")
        .select("id, full_name, stage, score, last_contacted_at")
        .eq("agent_id", agentId)
        .eq("archived", false)
        .not("stage", "in", '("closed","lost")')
        .or(
          `last_contacted_at.is.null,last_contacted_at.lt.${staleThreshold.toISOString()}`,
        )
        .order("score", { ascending: false })
        .limit(3);

      for (const lead of staleLeads ?? []) {
        const daysSince = lead.last_contacted_at
          ? Math.floor(
              (Date.now() - new Date(lead.last_contacted_at).getTime()) /
                86400000,
            )
          : null;

        actions.push({
          agent_id: agentId,
          lead_id: lead.id,
          priority: lead.score >= 70 ? "urgent" : "today",
          action_type: "follow_up",
          title: `Follow up with ${lead.full_name}`,
          body: daysSince
            ? `${lead.full_name} hasn't been contacted in ${daysSince} days. Score: ${lead.score}. Stage: ${lead.stage}.`
            : `${lead.full_name} has never been contacted. Score: ${lead.score}. Stage: ${lead.stage}.`,
          suggested_message: `Hi ${lead.full_name.split(" ")[0]}, just checking in — are you still looking for a property? I have some great new listings that might interest you.`,
          generated_date: today,
        });
      }

      // ──────────────────────────────────────────────────
      // 2. UPCOMING VIEWINGS — remind 1 day before
      // ──────────────────────────────────────────────────
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
      ).toISOString();
      const tomorrowEnd = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        23,
        59,
        59,
      ).toISOString();

      const { data: upcomingViewings } = await supabase
        .from("viewings")
        .select("id, scheduled_at, leads(full_name, phone), properties(title)")
        .eq("agent_id", agentId)
        .eq("status", "scheduled")
        .gte("scheduled_at", tomorrowStart)
        .lte("scheduled_at", tomorrowEnd);

      for (const viewing of upcomingViewings ?? []) {
        const lead = viewing.leads as { full_name: string; phone: string } | null;
        const property = viewing.properties as { title: string } | null;
        const time = new Date(viewing.scheduled_at).toLocaleTimeString("en-NG", {
          hour: "numeric",
          minute: "2-digit",
        });

        actions.push({
          agent_id: agentId,
          lead_id: (viewing as Record<string, unknown>).lead_id,
          priority: "today",
          action_type: "confirm_viewing",
          title: `Confirm tomorrow's viewing with ${lead?.full_name ?? "Lead"}`,
          body: `Viewing of ${property?.title ?? "the property"} is scheduled for tomorrow at ${time}.`,
          suggested_message: `Hi ${lead?.full_name?.split(" ")[0] ?? "there"}, just confirming your viewing tomorrow at ${time} — looking forward to showing you the property!`,
          generated_date: today,
        });
      }

      // ──────────────────────────────────────────────────
      // 3. PAST VIEWINGS — no outcome logged yet
      // ──────────────────────────────────────────────────
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data: pastViewings } = await supabase
        .from("viewings")
        .select("id, scheduled_at, leads(full_name), properties(title)")
        .eq("agent_id", agentId)
        .eq("status", "scheduled") // still 'scheduled' = outcome not logged
        .gte("scheduled_at", twoDaysAgo.toISOString())
        .lt("scheduled_at", new Date().toISOString())
        .limit(2);

      for (const viewing of pastViewings ?? []) {
        const lead = viewing.leads as { full_name: string } | null;
        const property = viewing.properties as { title: string } | null;

        actions.push({
          agent_id: agentId,
          lead_id: (viewing as Record<string, unknown>).lead_id,
          priority: "today",
          action_type: "log_outcome",
          title: `Log outcome for ${lead?.full_name ?? "Lead"}'s viewing`,
          body: `The viewing of ${property?.title ?? "the property"} has passed but no outcome was logged. Add a rating and notes.`,
          generated_date: today,
        });
      }

      // ──────────────────────────────────────────────────
      // 4. DEALS — low probability or stalled
      // ──────────────────────────────────────────────────
      const { data: stalledDeals } = await supabase
        .from("deals")
        .select(
          "id, closing_probability, leads(full_name), properties(title), status",
        )
        .eq("agent_id", agentId)
        .not("status", "in", '("completed","fallen_through")')
        .lte("closing_probability", DEAL_PROBABILITY_DROP_THRESHOLD)
        .limit(2);

      for (const deal of stalledDeals ?? []) {
        const lead = deal.leads as { full_name: string } | null;
        const property = deal.properties as { title: string } | null;
        const prob = Math.round((deal.closing_probability ?? 0) * 100);

        actions.push({
          agent_id: agentId,
          deal_id: deal.id,
          priority: "urgent",
          action_type: "check_deal",
          title: `Review stalled deal: ${property?.title ?? "Deal"}`,
          body: `The deal with ${lead?.full_name ?? "Lead"} for ${property?.title ?? "the property"} has a closing probability of only ${prob}%. It may need attention.`,
          generated_date: today,
        });
      }

      // ──────────────────────────────────────────────────
      // 5. NEW LEADS — captured today, not yet contacted
      // ──────────────────────────────────────────────────
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: newLeads } = await supabase
        .from("leads")
        .select("id, full_name, source, score")
        .eq("agent_id", agentId)
        .eq("stage", "new")
        .gte("created_at", todayStart.toISOString())
        .limit(3);

      for (const lead of newLeads ?? []) {
        actions.push({
          agent_id: agentId,
          lead_id: lead.id,
          priority: lead.score >= 80 ? "urgent" : "today",
          action_type: "follow_up",
          title: `New lead: reach out to ${lead.full_name}`,
          body: `${lead.full_name} was captured today via ${lead.source.replace("_", " ")} with a score of ${lead.score}. Make first contact.`,
          suggested_message: `Hi ${lead.full_name.split(" ")[0]}, I got your details and wanted to reach out personally. What kind of property are you looking for?`,
          generated_date: today,
        });
      }

      // Deduplicate by lead_id+action_type for today (avoid double actions)
      if (actions.length > 0) {
        // Delete existing undismissed/uncompleted actions for today first
        await supabase
          .from("ai_actions")
          .delete()
          .eq("agent_id", agentId)
          .eq("generated_date", today)
          .eq("completed", false)
          .eq("dismissed", false);

        const { error: insertError } = await supabase
          .from("ai_actions")
          .insert(actions);

        if (insertError) {
          errors.push(`Agent ${agentId}: ${insertError.message}`);
        } else {
          totalCreated += actions.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        actionsCreated: totalCreated,
        agents: profiles?.length ?? 0,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
