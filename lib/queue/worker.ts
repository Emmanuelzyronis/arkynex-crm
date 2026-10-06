import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { jobs, leads } from "@/lib/db/schema";
import type { Job } from "@/lib/db/schema";
import { regenerateActionsForAgent } from "@/lib/ai/generate-actions";
import { scoreLead } from "@/lib/ai/score-lead";
import { sendEmail, sendSms } from "@/lib/comms/delivery";
import { claimJobs } from "@/lib/queue";

export type JobResult = { processed: number; failed: number; claimed: number };

/** Job type → handler. Add a case here to extend the queue. */
async function runJob(job: Job): Promise<void> {
  const payload = (job.payload ?? {}) as Record<string, unknown>;

  switch (job.type) {
    case "ai.generate-actions": {
      const agentId = String(payload.agentId ?? "");
      if (!agentId) throw new Error("ai.generate-actions requires agentId");
      await regenerateActionsForAgent(agentId);
      return;
    }
    case "lead.rescore": {
      const leadId = String(payload.leadId ?? "");
      if (!leadId) throw new Error("lead.rescore requires leadId");
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      if (!lead) return;
      const score = scoreLead(lead);
      if (score !== lead.score) {
        await db.update(leads).set({ score }).where(eq(leads.id, leadId));
      }
      return;
    }
    case "email.send": {
      const to = String(payload.to ?? "");
      const subject = String(payload.subject ?? "Follow-up");
      const text = String(payload.text ?? "");
      if (!to || !text) throw new Error("email.send requires to + text");
      const result = await sendEmail({ to, subject, text });
      if (!result.ok) throw new Error(`email.send failed: ${result.error}`);
      return;
    }
    case "sms.send": {
      const to = String(payload.to ?? "");
      const body = String(payload.body ?? "");
      if (!to || !body) throw new Error("sms.send requires to + body");
      const result = await sendSms({ to, body });
      if (!result.ok) throw new Error(`sms.send failed: ${result.error}`);
      return;
    }
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

/**
 * Drain a batch of due jobs with retry + exponential backoff. Called by the
 * `/api/cron/process-jobs` route every minute.
 */
export async function processJobs(limit = 20): Promise<JobResult> {
  const claimed = await claimJobs(limit);
  let processed = 0;
  let failed = 0;

  for (const job of claimed) {
    try {
      await runJob(job);
      await db
        .update(jobs)
        .set({ status: "done", lockedAt: null, lastError: null })
        .where(eq(jobs.id, job.id));
      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed++;
      if (job.attempts >= job.maxAttempts) {
        await db
          .update(jobs)
          .set({ status: "failed", lockedAt: null, lastError: message })
          .where(eq(jobs.id, job.id));
      } else {
        const backoffMs = Math.min(60_000 * 2 ** Math.max(0, job.attempts - 1), 3_600_000);
        await db
          .update(jobs)
          .set({
            status: "pending",
            lockedAt: null,
            lastError: message,
            runAt: new Date(Date.now() + backoffMs),
          })
          .where(eq(jobs.id, job.id));
      }
    }
  }

  return { claimed: claimed.length, processed, failed };
}
