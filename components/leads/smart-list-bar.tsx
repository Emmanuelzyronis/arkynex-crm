"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, SlidersHorizontal, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createSmartList, deleteSmartList } from "@/lib/db/mutations/smart-lists";
import { SMART_LIST_PRESETS, type SmartListFilters } from "@/lib/leads/smart-lists";
import { leadSourceOptions, propertyTypeOptions, timelineOptions } from "@/lib/options";
import { cn } from "@/lib/utils";

export type SmartListChip = {
  id: string;
  name: string;
  count: number;
  filters: SmartListFilters;
};

const STAGE_OPTIONS = [
  { value: "", label: "Any stage" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "viewing_scheduled,viewed", label: "Viewing" },
  { value: "negotiating,offer_made", label: "Negotiating" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

const SORT_OPTIONS = [
  { value: "score", label: "Highest score" },
  { value: "recent", label: "Newest first" },
  { value: "last_contact", label: "Longest since contact" },
  { value: "name", label: "Name A–Z" },
];

const EMPTY_FORM: Record<string, string> = {
  name: "",
  stage: "",
  source: "",
  propertyType: "",
  timeline: "",
  minScore: "",
  maxScore: "",
  minBudget: "",
  maxBudget: "",
  lastContactedDays: "",
  createdWithinDays: "",
  assignedToId: "",
  sort: "score",
  icon: "",
};

export function SmartListBar({
  lists,
  activeId,
  members,
}: {
  lists: SmartListChip[];
  activeId?: string;
  members: { id: string; fullName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(EMPTY_FORM);

  const active = lists.find((list) => list.id === activeId);
  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  function openWith(preset?: Partial<Record<string, string>>) {
    const next: Record<string, string> = { ...EMPTY_FORM };
    for (const [key, value] of Object.entries(preset ?? {})) {
      if (value != null) next[key] = value;
    }
    setForm(next);
    setOpen(true);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/leads"
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            !activeId
              ? "border-primary bg-primary/10 text-primary"
              : "border-line text-ink-muted hover:border-ink-muted",
          )}
        >
          All leads
        </Link>

        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/leads?list=${list.id}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeId === list.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-ink-muted hover:border-ink-muted",
            )}
          >
            {list.name}
            <span className="rounded-full bg-surface px-1.5 text-[10px] font-semibold text-ink-muted">
              {list.count}
            </span>
          </Link>
        ))}

        <button
          type="button"
          onClick={() => openWith()}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-line px-3.5 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          New smart list
        </button>
      </div>

      {active && (
        <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>
            <span className="font-medium text-ink">{active.name}</span> · {active.count} lead
            {active.count === 1 ? "" : "s"} matching
          </span>
          <form action={deleteSmartList}>
            <input type="hidden" name="id" value={active.id} />
            <button
              type="submit"
              className="flex items-center gap-1 text-status-lost hover:underline"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </form>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative mx-auto mt-[8vh] max-h-[84vh] w-[94%] max-w-2xl overflow-y-auto rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">New smart list</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Save a filtered view of your pipeline. Counts update automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-muted hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Start from a preset
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SMART_LIST_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() =>
                      openWith({
                        ...Object.fromEntries(
                          Object.entries(preset.filters).map(([k, v]) => [k, String(v)]),
                        ),
                        name: preset.name,
                      })
                    }
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form action={createSmartList} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="list-name">List name</Label>
                <Input
                  id="list-name"
                  name="name"
                  required
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="e.g. High-intent buyers"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-stage">Stage</Label>
                <Select
                  id="list-stage"
                  name="stage"
                  value={form.stage}
                  onChange={(event) => set("stage", event.target.value)}
                >
                  {STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-source">Source</Label>
                <Select
                  id="list-source"
                  name="source"
                  value={form.source}
                  onChange={(event) => set("source", event.target.value)}
                >
                  <option value="">Any source</option>
                  {leadSourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-type">Property type</Label>
                <Select
                  id="list-type"
                  name="propertyType"
                  value={form.propertyType}
                  onChange={(event) => set("propertyType", event.target.value)}
                >
                  <option value="">Any type</option>
                  {propertyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-timeline">Timeline</Label>
                <Select
                  id="list-timeline"
                  name="timeline"
                  value={form.timeline}
                  onChange={(event) => set("timeline", event.target.value)}
                >
                  <option value="">Any timeline</option>
                  {timelineOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-min-score">Minimum score</Label>
                <Input
                  id="list-min-score"
                  name="minScore"
                  type="number"
                  min={0}
                  max={100}
                  value={form.minScore}
                  onChange={(event) => set("minScore", event.target.value)}
                  placeholder="e.g. 80"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-assignee">Assigned to</Label>
                <Select
                  id="list-assignee"
                  name="assignedToId"
                  value={form.assignedToId}
                  onChange={(event) => set("assignedToId", event.target.value)}
                >
                  <option value="">Anyone</option>
                  <option value="unassigned">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-min-budget">Budget from ($)</Label>
                <Input
                  id="list-min-budget"
                  name="minBudget"
                  type="number"
                  min={0}
                  value={form.minBudget}
                  onChange={(event) => set("minBudget", event.target.value)}
                  placeholder="e.g. 500000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-max-budget">Budget to ($)</Label>
                <Input
                  id="list-max-budget"
                  name="maxBudget"
                  type="number"
                  min={0}
                  value={form.maxBudget}
                  onChange={(event) => set("maxBudget", event.target.value)}
                  placeholder="Leave blank for no limit"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-last-contact">No contact in (days)</Label>
                <Input
                  id="list-last-contact"
                  name="lastContactedDays"
                  type="number"
                  min={1}
                  value={form.lastContactedDays}
                  onChange={(event) => set("lastContactedDays", event.target.value)}
                  placeholder="e.g. 3"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-created">Added in last (days)</Label>
                <Input
                  id="list-created"
                  name="createdWithinDays"
                  type="number"
                  min={1}
                  value={form.createdWithinDays}
                  onChange={(event) => set("createdWithinDays", event.target.value)}
                  placeholder="e.g. 7"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-sort">Sort by</Label>
                <Select
                  id="list-sort"
                  name="sort"
                  value={form.sort}
                  onChange={(event) => set("sort", event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save smart list</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
