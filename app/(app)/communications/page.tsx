import { redirect } from "next/navigation";

import { getConversations } from "@/lib/db/queries/communications";
import { CommunicationsInbox } from "@/components/communications/communications-inbox";
import { requireUser } from "@/lib/auth/user";

export default async function CommunicationsPage() {
  const userId = await requireUser();

  const conversations = await getConversations(userId);

  return (
    <div className="flex h-full flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Communications</h1>
        <p className="mt-1 text-sm text-ink-muted">
          One timeline per lead — calls, email, SMS and notes in sync.
        </p>
      </div>

      <CommunicationsInbox initialConversations={conversations} />
    </div>
  );
}
