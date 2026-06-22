import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Save } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getLead } from "@/lib/supabase/queries/leads";
import { updateLead } from "@/lib/supabase/mutations/update-lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormPageHeader, FormSection } from "@/components/forms/form-layout";
import { leadSourceOptions, operatingAreas, propertyTypeOptions, timelineOptions } from "@/lib/options";

export default async function EditLeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let lead: Awaited<ReturnType<typeof getLead>>;
  try {
    lead = await getLead(supabase, id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <FormPageHeader
        backHref={`/leads/${id}`}
        backLabel="Back to lead"
        title={`Edit — ${lead.full_name}`}
        description="Update contact details, requirement and notes."
      />

      {error && (
        <div className="rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
          {decodeURIComponent(error)}
        </div>
      )}

      <form>
        <input type="hidden" name="leadId" value={lead.id} />

        <div className="space-y-6">
          <FormSection title="Contact">
            <FormField label="Full name" htmlFor="fullName">
              <Input id="fullName" name="fullName" required defaultValue={lead.full_name} />
            </FormField>
            <FormField label="Phone number" htmlFor="phone">
              <Input id="phone" name="phone" required defaultValue={lead.phone} />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" defaultValue={lead.email ?? ""} />
            </FormField>
            <FormField label="Company" htmlFor="company">
              <Input id="company" name="company" defaultValue={lead.company ?? ""} />
            </FormField>
          </FormSection>

          <FormSection title="Requirement">
            <FormField label="Property type" htmlFor="propertyType">
              <Select id="propertyType" name="propertyType" defaultValue={lead.property_type ?? ""}>
                <option value="">Any</option>
                {propertyTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Bedrooms" htmlFor="bedrooms">
              <Input id="bedrooms" name="bedrooms" type="number" inputMode="numeric" min={0}
                defaultValue={lead.bedrooms ?? ""} />
            </FormField>
            <FormField label="Budget min" htmlFor="budgetMin">
              <CurrencyInput id="budgetMin" name="budgetMin" defaultValue={lead.budget_min ?? ""} />
            </FormField>
            <FormField label="Budget max" htmlFor="budgetMax">
              <CurrencyInput id="budgetMax" name="budgetMax" defaultValue={lead.budget_max ?? ""} />
            </FormField>
            <FormField label="Timeline" htmlFor="timeline">
              <Select id="timeline" name="timeline" defaultValue={lead.timeline ?? ""}>
                <option value="">Select timeline</option>
                {timelineOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Preferred areas" full>
              <div className="flex flex-wrap gap-2">
                {operatingAreas.map((area) => (
                  <label
                    key={area}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                  >
                    <input
                      type="checkbox"
                      name="areas"
                      value={area}
                      defaultChecked={(lead.location_prefs ?? []).includes(area)}
                      className="sr-only"
                    />
                    {area}
                  </label>
                ))}
              </div>
            </FormField>
          </FormSection>

          <FormSection title="Source & Notes">
            <FormField label="Source" htmlFor="source">
              <Select id="source" name="source" defaultValue={lead.source}>
                {leadSourceOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Notes" htmlFor="notes" full>
              <Textarea id="notes" name="notes" defaultValue={lead.notes ?? ""} />
            </FormField>
          </FormSection>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href={`/leads/${id}`}>Cancel</Link>
          </Button>
          <Button formAction={updateLead}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
