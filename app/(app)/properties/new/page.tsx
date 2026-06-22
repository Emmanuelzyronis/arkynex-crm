import Link from "next/link";
import { Plus } from "lucide-react";

import { createProperty } from "@/lib/supabase/mutations/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormPageHeader, FormSection } from "@/components/forms/form-layout";
import { amenityOptions, conditionOptions, furnishingOptions, operatingAreas, propertyStatusOptions, propertyTypeOptions } from "@/lib/options";

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-3xl space-y-6">
      <FormPageHeader
        backHref="/properties"
        backLabel="Back to Properties"
        title="Add Property"
        description="List a new property for your pipeline and AI matching."
      />

      {error && (
        <div className="rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
          {decodeURIComponent(error)}
        </div>
      )}

      <form>
        <div className="space-y-6">
          <FormSection title="Details">
            <FormField label="Title" htmlFor="title" full>
              <Input id="title" name="title" required placeholder="e.g. 4 Bedroom Duplex" />
            </FormField>
            <FormField label="Property type" htmlFor="propertyType">
              <Select id="propertyType" name="propertyType" required defaultValue="">
                <option value="" disabled>Select a type</option>
                {propertyTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue="active">
                {propertyStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Description" htmlFor="description" full>
              <Textarea id="description" name="description" placeholder="Describe the property..." />
            </FormField>
          </FormSection>

          <FormSection title="Location">
            <FormField label="Area" htmlFor="area">
              <Select id="area" name="area" defaultValue="">
                <option value="">Select area</option>
                {operatingAreas.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </FormField>
            <FormField label="City" htmlFor="city">
              <Input id="city" name="city" defaultValue="Lagos" />
            </FormField>
            <FormField label="Address" htmlFor="address" full>
              <Input id="address" name="address" placeholder="Street address (optional)" />
            </FormField>
          </FormSection>

          <FormSection title="Specs">
            <FormField label="Price" htmlFor="price">
              <CurrencyInput id="price" name="price" required placeholder="0" />
            </FormField>
            <FormField label="Size (sqm)" htmlFor="size">
              <Input id="size" name="size" type="number" inputMode="numeric" min={0} placeholder="0" />
            </FormField>
            <FormField label="Bedrooms" htmlFor="bedrooms">
              <Input id="bedrooms" name="bedrooms" type="number" inputMode="numeric" min={0} placeholder="0" />
            </FormField>
            <FormField label="Bathrooms" htmlFor="bathrooms">
              <Input id="bathrooms" name="bathrooms" type="number" inputMode="numeric" min={0} placeholder="0" />
            </FormField>
            <FormField label="Condition" htmlFor="condition">
              <Select id="condition" name="condition" defaultValue="">
                <option value="">Select condition</option>
                {conditionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Furnishing" htmlFor="furnishing">
              <Select id="furnishing" name="furnishing" defaultValue="">
                <option value="">Select furnishing</option>
                {furnishingOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
          </FormSection>

          <FormSection title="Amenities">
            <FormField full>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((amenity) => (
                  <label key={amenity} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary">
                    <input type="checkbox" name="amenities" value={amenity} className="sr-only" />
                    {amenity}
                  </label>
                ))}
              </div>
            </FormField>
          </FormSection>

          <FormSection title="Photos" description="Upload photos after saving the property from its detail page.">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-8 text-center sm:col-span-2">
              <p className="text-sm text-ink-muted">Photos can be uploaded from the property detail page once it&apos;s created.</p>
            </div>
          </FormSection>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/properties">Cancel</Link>
          </Button>
          <Button formAction={createProperty}>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </div>
      </form>
    </div>
  );
}
