import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[2px] border border-border bg-transparent px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-text-secondary w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none select-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-border-2 text-text-secondary hover:border-text-primary hover:text-text-primary",
        secondary: "border-border text-text-tertiary",
        destructive: "border-accent text-accent",
        outline: "border-border text-text-secondary",
        accent: "border-accent text-accent",
        provenance: "border-provenance text-provenance",
        datum: "border-datum text-datum",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
