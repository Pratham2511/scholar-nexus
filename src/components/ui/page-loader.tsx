"use client";

import { useEffect, useState } from "react";

/**
 * Premium Minimal Research Loader
 * Elegant, smooth gradient ring with glowing center point
 */
export function QuantumLoader({
  size = "md",
  label = "Searching academic repositories...",
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const dimensions = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 select-none">
      <div className={`relative ${dimensions} flex items-center justify-center`}>
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-slate-700/40" />
        {/* Animated Gradient Spinner */}
        <div className="absolute inset-0 rounded-full border-2 border-t-[var(--color-primary)] border-r-[var(--color-coral)] border-b-transparent border-l-transparent animate-spin" />
        {/* Center Point */}
        <div className="w-2 h-2 rounded-full bg-[var(--color-primary-bright)] shadow-[0_0_8px_rgba(58, 157, 124,0.9)]" />
      </div>

      {label && (
        <span className="text-xs font-medium text-slate-400 tracking-wide font-mono">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Top Ambient Activity Indicator
 */
export function PageLoader() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setActive(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !active) return null;

  return (
    <div
      role="progressbar"
      aria-label="Workspace Initializing"
      aria-busy="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-[99999] overflow-hidden pointer-events-none bg-transparent"
    >
      <div className="h-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-coral)] to-[var(--color-primary)] animate-[progress-scan_0.6s_ease-in-out_infinite]" />
    </div>
  );
}
