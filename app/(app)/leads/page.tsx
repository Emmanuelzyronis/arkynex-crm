import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getLeads } from "@/lib/supabase/queries/leads";
import { Button } from "@/components/ui/button";
import { LeadsTable } from "@/components/leads/leads-table";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; q?: string }>;
}) {
  const { stage, q } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const leads = await getLeads(supabase, {
    stage: stage ?? "all",
    search: q,
    archived: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Leads</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} in your pipeline
          </p>
        </div>
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="h-4 w-4" />
            Add Lead
          </Link>
        </Button>
      </div>

      <LeadsTable leads={leads} />
    </div>
  );
}
