"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";
import { useAppStore } from "@/store/app-store";

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useAppStore((s) => s.theme);
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
