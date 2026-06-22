import Link from "next/link";
import { UserPlus } from "lucide-react";

import { createLead } from "@/lib/supabase/mutations/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormPageHeader, FormSection } from "@/components/forms/form-layout";
import { leadSourceOptions, operatingAreas, propertyTypeOptions, timelineOptions } from "@/lib/options";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-3xl space-y-6">
      <FormPageHeader
        backHref="/leads"
        backLabel="Back to Leads"
        title="Add Lead"
        description="Capture a new lead manually — AI scoring kicks in once it's saved."
      />

      {error && (
        <div className="rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
          {decodeURIComponent(error)}
        </div>
      )}

      <form>
        <div className="space-y-6">
          <FormSection title="Contact">
            <FormField label="Full name" htmlFor="fullName">
              <Input id="fullName" name="fullName" required placeholder="e.g. Tunde Adebayo" autoComplete="name" />
            </FormField>
            <FormField label="Phone number" htmlFor="phone">
              <PhoneInput id="phone" name="phone" required placeholder="801 234 5678" autoComplete="tel" />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" placeholder="optional" autoComplete="email" />
            </FormField>
            <FormField label="Company" htmlFor="company">
              <Input id="company" name="company" placeholder="optional" />
            </FormField>
          </FormSection>

          <FormSection title="Requirement" description="Helps AI match this lead to properties and prioritize follow-ups.">
            <FormField label="Property type" htmlFor="propertyType">
              <Select id="propertyType" name="propertyType" defaultValue="">
                <option value="">Any</option>
                {propertyTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Bedrooms" htmlFor="bedrooms">
              <Input id="bedrooms" name="bedrooms" type="number" inputMode="numeric" min={0} placeholder="0" />
            </FormField>
            <FormField label="Budget min" htmlFor="budgetMin">
              <CurrencyInput id="budgetMin" name="budgetMin" placeholder="0" />
            </FormField>
            <FormField label="Budget max" htmlFor="budgetMax">
              <CurrencyInput id="budgetMax" name="budgetMax" placeholder="0" />
            </FormField>
            <FormField label="Timeline" htmlFor="timeline">
              <Select id="timeline" name="timeline" defaultValue="">
                <option value="">Select timeline</option>
                {timelineOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Preferred areas" full>
              <div className="flex flex-wrap gap-2">
                {operatingAreas.map((area) => (
                  <label key={area} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary">
                    <input type="checkbox" name="areas" value={area} className="sr-only" />
                    {area}
                  </label>
                ))}
              </div>
            </FormField>
          </FormSection>

          <FormSection title="Source & Notes">
            <FormField label="Source" htmlFor="source">
              <Select id="source" name="source" defaultValue="manual">
                {leadSourceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Notes" htmlFor="notes" full>
              <Textarea id="notes" name="notes" placeholder="Anything else worth remembering about this lead..." />
            </FormField>
          </FormSection>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/leads">Cancel</Link>
          </Button>
          <Button formAction={createLead}>
            <UserPlus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </form>
    </div>
  );
}
