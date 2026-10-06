import Link from "next/link";
import { redirect } from "next/navigation";
import { Handshake } from "lucide-react";

import { createDeal } from "@/lib/db/mutations/deals";
import { getLeads } from "@/lib/db/queries/leads";
import { getProperties } from "@/lib/db/queries/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormPageHeader, FormSection } from "@/components/forms/form-layout";
import { requireUser } from "@/lib/auth/user";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const userId = await requireUser();

  const [leads, properties] = await Promise.all([
    getLeads(userId, { archived: false }),
    getProperties(userId),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <FormPageHeader backHref="/deals" backLabel="Back to Deals" title="New Deal" description="Start tracking a negotiation through to close." />

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
                <option key={l.id} value={l.id}>{l.fullName} — {l.phone}</option>
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

          <FormField label="Asking price" htmlFor="askingPrice">
            <CurrencyInput id="askingPrice" name="askingPrice" required placeholder="0" />
          </FormField>
          <FormField label="Agreed price" htmlFor="agreedPrice">
            <CurrencyInput id="agreedPrice" name="agreedPrice" placeholder="If different from asking" />
          </FormField>

          <FormField label="Commission rate (%)" htmlFor="commissionRate">
            <Input id="commissionRate" name="commissionRate" type="number" inputMode="decimal" min={0} max={100} step={0.5} defaultValue={5} />
          </FormField>
          <FormField label="Expected close date" htmlFor="closeDate">
            <Input id="closeDate" name="closeDate" type="date" />
          </FormField>

          <FormField label="Notes" htmlFor="notes" full>
            <Textarea id="notes" name="notes" placeholder="Negotiation context, conditions, next steps..." />
          </FormField>
        </FormSection>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" asChild><Link href="/deals">Cancel</Link></Button>
          <Button formAction={createDeal}>
            <Handshake className="h-4 w-4" />
            Create Deal
          </Button>
        </div>
      </form>
    </div>
  );
}
