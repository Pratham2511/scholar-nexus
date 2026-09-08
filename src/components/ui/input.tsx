import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-[2px] border border-border bg-surface-inset px-3 py-1 font-mono text-sm text-text-primary shadow-none transition-colors outline-none",
        "placeholder:font-ui placeholder:font-normal placeholder:text-text-tertiary",
        "focus-visible:border-border-2 focus-visible:ring-1 focus-visible:ring-border-2",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:ring-danger",
        className
      )}
      {...props}
    />
  );
}

export { Input };
