"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";

export function PageLoader() {
  const [shouldRender, setShouldRender] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("hasLoaded")) {
        setIsDone(true);
        return;
      }
    } catch {
      // Ignore sessionStorage access errors
    }

    setShouldRender(true);

    // Step 1 (0-0.3s): Left bracket '[' fades in
    const t1 = setTimeout(() => setStep(1), 50);
    // Step 2 (0.3-0.6s): Number '1' types in
    const t2 = setTimeout(() => setStep(2), 320);
    // Step 3 (0.6-0.9s): Right bracket ']' appears
    const t3 = setTimeout(() => setStep(3), 640);
    // Step 4 (0.9-1.2s): Overlay slides up over 0.4s
    const t4 = setTimeout(() => {
      setIsSliding(true);
    }, 950);
    // Complete (1.4s)
    const t5 = setTimeout(() => {
      try {
        sessionStorage.setItem("hasLoaded", "true");
      } catch {}
      setIsDone(true);
    }, 1400);

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
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[99999] pointer-events-auto select-none"
      style={{
        backgroundColor: "var(--color-ground)",
        transform: isSliding ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
        opacity: isSliding ? 0.95 : 1,
      }}
    >
      <div className="flex flex-col items-center gap-8">
        <Logo size="lg" />

        {/* Citation Assembler */}
        <div
          className="w-[200px] flex items-center justify-center text-center"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--color-gold)",
            fontSize: "1.5rem",
            letterSpacing: "0.2em",
            minHeight: "2.5rem",
          }}
          aria-live="polite"
        >
          <span
            style={{
              opacity: step >= 1 ? 1 : 0,
              transition: "opacity 0.25s ease-out",
            }}
          >
            [
          </span>
          <span
            style={{
              opacity: step >= 2 ? 1 : 0,
              display: "inline-block",
              width: step >= 2 ? "auto" : 0,
              overflow: "hidden",
              transition: "opacity 0.2s ease-out",
            }}
          >
            1
          </span>
          <span
            style={{
              opacity: step >= 3 ? 1 : 0,
              transition: "opacity 0.2s ease-out",
            }}
          >
            ]
          </span>
        </div>
      </div>
    </div>
  );
}
