import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getViewings } from "@/lib/supabase/queries/viewings";
import { updateViewingStatus } from "@/lib/supabase/mutations/viewings";
import { Button } from "@/components/ui/button";
import { ViewingsList } from "@/components/viewings/viewings-list";

export default async function ViewingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewings = await getViewings(supabase, { status });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Viewings</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {viewings.length} viewing{viewings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/viewings/new">
            <Plus className="h-4 w-4" />
            Schedule Viewing
          </Link>
        </Button>
      </div>

      <ViewingsList viewings={viewings} updateStatus={updateViewingStatus} />
    </div>
  );
}
