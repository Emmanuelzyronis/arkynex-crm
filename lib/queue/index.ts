import "server-only";

import { inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import type { Job } from "@/lib/db/schema";

export type { Job };

export type JobInput = {
  type: string;
  payload?: Record<string, unknown>;
  runAt?: Date;
  maxAttempts?: number;
};

function extractRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (
    result &&
    typeof result === "object" &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

/** Enqueue a single durable job. */
export async function enqueueJob(input: JobInput): Promise<string> {
  const [row] = await db
    .insert(jobs)
    .values({
      type: input.type,
      payload: input.payload ?? {},
      maxAttempts: input.maxAttempts ?? 5,
      runAt: input.runAt ?? new Date(),
    })
    .returning({ id: jobs.id });
  return row.id;
}

/** Enqueue a batch of jobs in one insert. */
export async function enqueueJobs(inputs: JobInput[]): Promise<number> {
  if (inputs.length === 0) return 0;
  await db.insert(jobs).values(
    inputs.map((input) => ({
      type: input.type,
      payload: input.payload ?? {},
      maxAttempts: input.maxAttempts ?? 5,
      runAt: input.runAt ?? new Date(),
    })),
  );
  return inputs.length;
}

/**
 * Atomically claim up to `limit` due jobs using `FOR UPDATE SKIP LOCKED` so
 * overlapping cron invocations never process the same job twice. Attempts are
 * incremented at claim time.
 */
export async function claimJobs(limit = 10): Promise<Job[]> {
  const claimed = await db.execute(sql`
    update jobs
    set status = 'processing',
        locked_at = now(),
        attempts = attempts + 1,
        updated_at = now()
    where id in (
      select id from jobs
      where status = 'pending' and run_at <= now()
      order by run_at asc
      limit ${limit}
      for update skip locked
    )
    returning id
  `);

  const ids = extractRows<{ id: string }>(claimed).map((row) => row.id);
  if (ids.length === 0) return [];

  return db.select().from(jobs).where(inArray(jobs.id, ids));
}
