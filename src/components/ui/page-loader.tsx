"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";

export function PageLoader() {
  const [shouldRender, setShouldRender] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("CALIBRATING INSTRUMENT");
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Respect reduced motion or prior session initialization
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsDone(true);
      return;
    }

    try {
      if (sessionStorage.getItem("sn_initialized_v3")) {
        setIsDone(true);
        return;
      }
    } catch {
      // Ignore sessionStorage issues
    }

    setShouldRender(true);

    const t1 = setTimeout(() => {
      setProgress(35);
      setStage("RESOLVING PROVENANCE REGISTERS");
    }, 120);

    const t2 = setTimeout(() => {
      setProgress(78);
      setStage("INDEXING EVIDENCE MATRIX");
    }, 320);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStage("WORKSPACE CALIBRATED");
    }, 550);

    const t4 = setTimeout(() => {
      setIsFading(true);
    }, 720);

    const t5 = setTimeout(() => {
      try {
        sessionStorage.setItem("sn_initialized_v3", "true");
      } catch {}
      setIsDone(true);
    }, 980);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  if (!shouldRender || isDone) return null;

  return (
    <aside
      aria-label="Workspace initialization"
      aria-busy="true"
      className="fixed inset-0 flex flex-col items-center justify-center z-[99999] pointer-events-auto select-none bg-ground"
      style={{
        opacity: isFading ? 0 : 1,
        transition: "opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="flex flex-col items-center gap-7 max-w-sm px-6">
        <Logo size="lg" showDescriptor />

        {/* Technical Coordinate Sweep Gauge */}
        <div className="w-64 flex flex-col gap-2 mt-4" aria-live="polite">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-text-tertiary uppercase">
            <span>{stage}</span>
            <span className="text-accent font-semibold">
              § {(progress / 100).toFixed(2)}
            </span>
          </div>

          <div className="h-[2px] w-full bg-border overflow-hidden relative">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
