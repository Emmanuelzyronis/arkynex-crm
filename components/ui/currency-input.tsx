import * as React from "react";

import { cn } from "@/lib/utils";

const CurrencyInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <div className="flex h-11 items-center rounded-xl border border-line bg-card transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      <span className="flex h-full items-center border-r border-line px-3 text-sm text-ink-muted">
        $
      </span>
      <input
        ref={ref}
        type="number"
        inputMode="numeric"
        min={0}
        className={cn(
          "h-full flex-1 rounded-r-xl bg-transparent px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
