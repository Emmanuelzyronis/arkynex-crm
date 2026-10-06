import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { getLeads } from "@/lib/db/queries/leads";
import { getSmartList, getSmartLists } from "@/lib/db/queries/smart-lists";
import { getActiveTeamMembers } from "@/lib/db/queries/team";
import { smartListToLeadFilters } from "@/lib/leads/smart-lists";
import { Button } from "@/components/ui/button";
import { LeadsTable } from "@/components/leads/leads-table";
import { SmartListBar } from "@/components/leads/smart-list-bar";
import { requireUser } from "@/lib/auth/user";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; q?: string; list?: string }>;
}) {
  const { stage, q, list } = await searchParams;
  const userId = await requireUser();

  const [lists, members, activeList] = await Promise.all([
    getSmartLists(userId),
    getActiveTeamMembers(userId),
    list ? getSmartList(userId, list) : Promise.resolve(null),
  ]);

  const leads = await getLeads(
    userId,
    activeList
      ? smartListToLeadFilters(activeList.filters)
      : { stage: stage ?? "all", search: q, archived: false },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {activeList ? activeList.name : "Leads"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} in your pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API download, not a page */}
            <a href="/api/export/leads">
              <Download className="h-4 w-4" />
              Export
            </a>
          </Button>
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="h-4 w-4" />
              Add Lead
            </Link>
          </Button>
        </div>
      </div>

      <SmartListBar
        lists={lists.map((smartList) => ({
          id: smartList.id,
          name: smartList.name,
          count: smartList.count,
          filters: smartList.filters,
        }))}
        activeId={activeList?.id}
        members={members.map((member) => ({ id: member.id, fullName: member.fullName }))}
      />

      <LeadsTable leads={leads} />
    </div>
  );
}
