import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getConversations } from "@/lib/supabase/queries/communications";
import { CommunicationsInbox } from "@/components/communications/communications-inbox";

export default async function CommunicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const conversations = await getConversations(supabase);

  return (
    <div className="flex h-full flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Communications</h1>
        <p className="mt-1 text-sm text-ink-muted">
          One timeline per lead — WhatsApp, calls, email and notes in sync.
        </p>
      </div>

      <CommunicationsInbox initialConversations={conversations} />
    </div>
  );
}
