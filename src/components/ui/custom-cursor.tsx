"use client";

import { useEffect, useRef, useState } from "react";

type HoverState = "default" | "button" | "card" | "input";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hoverState, setHoverState] = useState<HoverState>("default");

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mouseX = useRef(-100);
  const mouseY = useRef(-100);
  const ringX = useRef(-100);
  const ringY = useRef(-100);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only render on non-touch devices
    if (typeof window === "undefined" || navigator.maxTouchPoints > 0) {
      return;
    }
    setMounted(true);

    const onMouseMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
      if (!visible) setVisible(true);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
      }

      // Quick fallback delegation check
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest("input, textarea, [contenteditable='true']")) {
        setHoverState("input");
      } else if (target.closest(".paper-row, [data-slot='card'], article.paper-card, .project-paper-card")) {
        setHoverState("card");
      } else if (target.closest("a, button, [role='button'], [data-slot='button'], summary")) {
        setHoverState("button");
      } else {
        setHoverState("default");
      }
    };

    const onMouseDown = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX.current - 3}px, ${mouseY.current - 3}px, 0) scale(2)`;
      }
      setTimeout(() => {
        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${mouseX.current - 3}px, ${mouseY.current - 3}px, 0) scale(1)`;
        }
      }, 80);
    };

    const onMouseLeave = () => {
      setVisible(false);
    };

    const onMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    document.documentElement.addEventListener("mouseenter", onMouseEnter);

    // MutationObserver to attach listeners to hoverables
    const attachHoverListeners = () => {
      const buttons = document.querySelectorAll<HTMLElement>("a, button, [role='button'], [data-slot='button'], summary");
      const cards = document.querySelectorAll<HTMLElement>(".paper-row, [data-slot='card'], article.paper-card");
      const inputs = document.querySelectorAll<HTMLElement>("input, textarea, [contenteditable='true']");

      buttons.forEach((el) => {
        el.onmouseenter = () => setHoverState("button");
        el.onmouseleave = () => setHoverState("default");
      });

      cards.forEach((el) => {
        el.onmouseenter = () => setHoverState("card");
        el.onmouseleave = () => setHoverState("default");
      });

      inputs.forEach((el) => {
        el.onmouseenter = () => setHoverState("input");
        el.onmouseleave = () => setHoverState("default");
      });
    };

    attachHoverListeners();

    const observer = new MutationObserver(() => {
      attachHoverListeners();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Smooth lerp loop (0.12s smoothing using requestAnimationFrame)
    const lerpFactor = 0.16;
    const animate = () => {
      ringX.current += (mouseX.current - ringX.current) * lerpFactor;
      ringY.current += (mouseY.current - ringY.current) * lerpFactor;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX.current}px, ${ringY.current}px, 0) translate(-50%, -50%)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.documentElement.removeEventListener("mouseenter", onMouseEnter);
      observer.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [visible]);

  if (!mounted) return null;

  // Ring styles based on hover state
  let ringWidth = 28;
  let ringHeight = 28;
  let ringRadius = "50%";
  let ringBorder = "1px solid var(--color-text-tertiary)";
  let ringBg = "transparent";

  if (hoverState === "button") {
    ringWidth = 44;
    ringHeight = 44;
    ringRadius = "50%";
    ringBorder = "1px solid var(--color-gold)";
  } else if (hoverState === "card") {
    ringWidth = 48;
    ringHeight = 48;
    ringRadius = "4px";
    ringBorder = "1px solid var(--color-teal)";
  } else if (hoverState === "input") {
    ringWidth = 2;
    ringHeight = 24;
    ringRadius = "1px";
    ringBorder = "none";
    ringBg = "var(--color-text-secondary)";
  }

  const dotSize = hoverState === "button" ? 3 : 6;

  return (
    <>
      {/* Layer 1 — The DOT */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0"
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          backgroundColor: "var(--color-gold)",
          borderRadius: "50%",
          zIndex: 9999,
          mixBlendMode: "difference",
          opacity: visible ? 1 : 0,
          transform: "translate3d(-100px, -100px, 0)",
          transition: "width 0.15s ease, height 0.15s ease, opacity 0.15s ease",
          willChange: "transform",
        }}
      />

      {/* Layer 2 — THE RING */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0"
        style={{
          width: `${ringWidth}px`,
          height: `${ringHeight}px`,
          borderRadius: ringRadius,
          border: ringBorder,
          backgroundColor: ringBg,
          zIndex: 9998,
          opacity: visible ? 1 : 0,
          transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)",
          transition:
            "width 0.2s cubic-bezier(0.16, 1, 0.3, 1), height 0.2s cubic-bezier(0.16, 1, 0.3, 1), border 0.2s ease, border-radius 0.2s ease, background-color 0.2s ease, opacity 0.15s ease",
          willChange: "transform",
        }}
      />
    </>
  );
}
