import { helpCategories } from "@/lib/mock-help";

export function HelpCategories() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {helpCategories.map(({ title, description, icon: Icon }) => (
        <div key={title} className="rounded-2xl border border-line bg-card p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
      ))}
    </div>
  );
}
