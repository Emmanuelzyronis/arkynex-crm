"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { propertyTypeOptions, timelineOptions } from "@/lib/options";

export function CaptureForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token, source: "web_widget" }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("done");
      form.reset();
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-closed/10 text-status-closed">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="mt-4 text-lg font-semibold text-ink">Thanks — you&apos;re all set!</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Your details are on the way to your agent. Expect matching properties
          shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="fullName">Your name</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="propertyType">Property type</Label>
        <Select id="propertyType" name="propertyType" defaultValue="apartment">
          {propertyTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bedrooms">Bedrooms</Label>
        <Input id="bedrooms" name="bedrooms" type="number" min="0" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="budgetMin">Budget min ($)</Label>
        <Input id="budgetMin" name="budgetMin" type="number" min="0" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="budgetMax">Budget max ($)</Label>
        <Input id="budgetMax" name="budgetMax" type="number" min="0" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="areas">Preferred areas</Label>
        <Input id="areas" name="areas" placeholder="Downtown, Riverside" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="timeline">Timeline</Label>
        <Select id="timeline" name="timeline" defaultValue="1_month">
          {timelineOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="notes">What are you looking for?</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="e.g. 3 bed apartment with parking, close to schools"
        />
      </div>

      {error && (
        <p className="sm:col-span-2 text-sm text-status-lost">{error}</p>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Send my details
        </Button>
      </div>
    </form>
  );
}
