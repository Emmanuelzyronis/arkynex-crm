import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { saveBusinessStep } from "@/lib/db/mutations/onboarding";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const areas = [
  "Downtown", "Riverside", "Chelsea", "Greenwood",
  "Harbor Island", "Maplewood", "Midtown", "Northgate",
];

const propertyTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "office", label: "Office" },
];

export default function BusinessStep() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Set up your business
      </h1>
      <p className="mt-1.5 text-ink-muted">
        Tell us where you operate and what you sell — this powers AI matching and lead scoring.
      </p>

      <form className="mt-8">
        {/* Primary market */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-ink">Primary market</p>
          <Select name="primaryMarket" defaultValue="New York" className="max-w-xs">
            <option>New York</option><option>London</option><option>Dubai</option><option>Miami</option><option>Other</option>
          </Select>
        </div>

        {/* Areas */}
        <div className="mt-6">
          <p className="text-sm font-medium text-ink">Areas you operate in</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {areas.map((area) => (
              <label
                key={area}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
              >
                <input type="checkbox" name="areas" value={area} className="sr-only" />
                {area}
              </label>
            ))}
          </div>
        </div>

        {/* Property types */}
        <div className="mt-6">
          <p className="text-sm font-medium text-ink">Property types</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {propertyTypes.map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium text-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
              >
                <input type="checkbox" name="propertyTypes" value={value} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/onboarding/profile">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button size="lg" formAction={saveBusinessStep}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
