"use client";

import { useEffect, useRef } from "react";

/**
 * KIVO Ambient Cursor
 * - Refined, zero-delay brass pointer follower
 * - Native pointer is 100% active, crisp, and lag-free
 * - Seamlessly accents interactive elements with a warm gold ambient aura
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let targetX = -200;
    let targetY = -200;
    let ringX = -200;
    let ringY = -200;
    let isVisible = false;
    let isHovering = false;
    let rafId: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = "0.75";
        ring.style.opacity = "1";
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput = Boolean(
        target.closest("input, textarea, [contenteditable='true'], select")
      );
      const isAction = Boolean(
        target.closest("button, a, [role='button'], .btn, .tech-card, .paper-card, summary, input[type='checkbox']")
      );

      if (isInput) {
        dot.style.opacity = "0";
        ring.style.opacity = "0";
      } else {
        dot.style.opacity = "0.75";
        ring.style.opacity = "1";
      }

      if (isAction !== isHovering) {
        isHovering = isAction;
        if (isHovering) {
          ring.style.width = "40px";
          ring.style.height = "40px";
          ring.style.marginLeft = "-20px";
          ring.style.marginTop = "-20px";
          ring.style.borderColor = "rgba(92, 196, 160, 0.7)";
          ring.style.backgroundColor = "rgba(58, 157, 124, 0.08)";
          ring.style.boxShadow = "0 0 16px rgba(58, 157, 124, 0.25)";
        } else {
          ring.style.width = "28px";
          ring.style.height = "28px";
          ring.style.marginLeft = "-14px";
          ring.style.marginTop = "-14px";
          ring.style.borderColor = "rgba(92, 196, 160, 0.35)";
          ring.style.backgroundColor = "transparent";
          ring.style.boxShadow = "none";
        }
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible = true;
      dot.style.opacity = "0.75";
      ring.style.opacity = "1";
    };

    const loop = () => {
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

      const speed = 0.22;
      ringX += (targetX - ringX) * speed;
      ringY += (targetY - ringY) * speed;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    document.documentElement.addEventListener("mouseenter", onMouseEnter);

    rafId = requestAnimationFrame(loop);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.documentElement.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden select-none"
    >
      {/* Precision Micro Point */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-[#5cc4a0] opacity-0 transition-opacity duration-150 will-change-transform shadow-[0_0_8px_#5cc4a0]"
      />

      {/* Radiant Brass Ambient Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border border-[#5cc4a0]/35 opacity-0 transition-[width,height,margin,border-color,background-color,box-shadow,opacity] duration-200 ease-out will-change-transform"
      />
    </div>
  );
}
