import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-ui font-medium uppercase tracking-[0.08em] text-[0.72rem] transition-all duration-120 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 outline-none focus-visible:outline-1.5 focus-visible:outline-accent focus-visible:outline-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-ground hover:bg-accent-dim active:scale-[0.98]",
        destructive:
          "bg-danger text-ground hover:opacity-90 active:scale-[0.98]",
        outline:
          "border border-border-2 bg-transparent text-text-secondary hover:border-text-primary hover:text-text-primary",
        secondary:
          "border border-border bg-surface text-text-secondary hover:border-border-2 hover:text-text-primary",
        ghost:
          "bg-transparent border border-transparent text-text-secondary hover:border-border hover:text-text-primary",
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
