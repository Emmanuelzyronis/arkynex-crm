import * as React from "react";

import { cn } from "@/lib/utils";

const PhoneInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <div className="flex h-11 items-center rounded-xl border border-line bg-card transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      <span className="flex h-full items-center gap-1.5 border-r border-line px-3 text-sm text-ink">
        <span aria-hidden="true">🇳🇬</span>
        +234
      </span>
      <input
        ref={ref}
        type="tel"
        className={cn(
          "h-full flex-1 rounded-r-xl bg-transparent px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
