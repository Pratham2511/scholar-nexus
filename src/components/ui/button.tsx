import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-ui font-semibold uppercase tracking-[0.08em] text-[0.75rem] transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 outline-none focus-visible:outline-1 focus-visible:outline-gold focus-visible:outline-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gold text-ground hover:bg-gold-dim hover:scale-[0.98] active:scale-[0.96]",
        destructive:
          "bg-danger text-ground hover:opacity-90 hover:scale-[0.98]",
        outline:
          "border border-border-2 bg-transparent text-text-secondary hover:border-gold hover:text-gold",
        secondary:
          "border border-border-2 bg-transparent text-text-secondary hover:border-gold hover:text-gold",
        ghost:
          "bg-transparent border border-transparent text-text-secondary hover:border-border-2 hover:text-text-primary",
        link:
          "text-link underline-offset-4 hover:underline normal-case tracking-normal font-normal",
      },
      size: {
        default: "min-h-[38px] px-5 py-2.5",
        sm: "min-h-[32px] px-3.5 py-1.5 text-[0.7rem]",
        lg: "min-h-[44px] px-6 py-3 text-[0.8rem]",
        icon: "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
