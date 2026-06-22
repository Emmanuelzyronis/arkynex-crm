import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createViewing } from "@/lib/supabase/mutations/viewings";
import { getLeads } from "@/lib/supabase/queries/leads";
import { getProperties } from "@/lib/supabase/queries/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormPageHeader, FormSection } from "@/components/forms/form-layout";

export default async function NewViewingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [leads, properties] = await Promise.all([
    getLeads(supabase, { archived: false }),
    getProperties(supabase),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <FormPageHeader backHref="/viewings" backLabel="Back to Viewings" title="Schedule Viewing" description="Book a property viewing for a lead — reminders are sent automatically." />

      {error && (
        <div className="rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
          {decodeURIComponent(error)}
        </div>
      )}

      <form>
        <FormSection title="Details">
          <FormField label="Lead" htmlFor="lead" full>
            <Select id="lead" name="lead" defaultValue="" required>
              <option value="" disabled>Select a lead</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.full_name} — {l.phone}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Property" htmlFor="property" full>
            <Select id="property" name="property" defaultValue="" required>
              <option value="" disabled>Select a property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.title} — {p.area ?? p.city}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Date" htmlFor="date">
            <Input id="date" name="date" type="date" required />
          </FormField>
          <FormField label="Time" htmlFor="time">
            <Input id="time" name="time" type="time" required />
          </FormField>

          <FormField label="Notes" htmlFor="notes" full>
            <Textarea id="notes" name="notes" placeholder="Anything the agent should know before the viewing..." />
          </FormField>
        </FormSection>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" asChild><Link href="/viewings">Cancel</Link></Button>
          <Button formAction={createViewing}>
            <CalendarPlus className="h-4 w-4" />
            Schedule Viewing
          </Button>
        </div>
      </form>
    </div>
  );
}
