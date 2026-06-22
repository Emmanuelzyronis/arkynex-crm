import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-[30px] w-[30px] shrink-0", className)}
    >
      <rect x="2" y="15" width="6" height="15" rx="1.5" fill="#A5A8F5" />
      <rect x="10" y="9" width="6" height="21" rx="1.5" fill="#7C7FF0" />
      <rect x="18" y="2" width="6" height="28" rx="1.5" fill="#5B5FEF" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-tight text-ink">
          Arkynex
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Real Estate CRM
        </span>
      </div>
    </div>
  );
}
