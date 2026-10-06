import { createBrowserClient } from "@supabase/ssr";

import type { Database, SupaClient } from "@/lib/supabase/types";

/**
 * Use this in Client Components ("use client") and browser-side code.
 * Creates a new instance on every call — safe to call at module level in RSC.
 */
export function createClient(): SupaClient {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
