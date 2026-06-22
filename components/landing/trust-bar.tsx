import { Building2, Gem, Hexagon, Landmark, Mountain, Target } from "lucide-react";

const companies = [
  { name: "Veritasi Homes", icon: Mountain },
  { name: "Landmark Corporate Realty", icon: Landmark },
  { name: "Rockstone Properties", icon: Building2 },
  { name: "Bloomfield Investments", icon: Gem },
  { name: "PWAN Plus", icon: Hexagon },
  { name: "Xclusive Properties", icon: Target },
];

export function TrustBar() {
  return (
    <section className="border-t border-line/60">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Trusted by 1,000+ real estate professionals
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {companies.map(({ name, icon: Icon }) => (
            <div
              key={name}
              className="flex items-center gap-2 text-ink-muted/70 transition-colors hover:text-ink-muted"
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-tight">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
