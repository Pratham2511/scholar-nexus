"use client";

import { useEffect, useRef } from "react";

/**
 * Optical Reticle Custom Cursor
 *
 * Designed for precision research instruments:
 * - 0 React state updates on mousemove (pure direct DOM mutation via RAF)
 * - Automatic graceful fallback on touch devices (maxTouchPoints > 0)
 * - Full respect for prefers-reduced-motion
 * - Non-destructive text selection (yields to native caret on inputs)
 * - Semantic states: default crosshair, action lock, evidence bracket, text yield
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices, SSR, or if user prefers reduced motion
    if (
      typeof window === "undefined" ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const cursorEl = cursorRef.current;
    if (!cursorEl) return;

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let isVisible = false;
    let isMouseDown = false;
    let currentState: "default" | "action" | "paper" | "text" = "default";
    let rafId: number | null = null;

    document.documentElement.classList.add("has-custom-cursor");

    const updatePosition = () => {
      // Smooth 0.15 lerp for the outer reticle assembly
      currentX += (mouseX - currentX) * 0.35;
      currentY += (mouseY - currentY) * 0.35;

      cursorEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

      rafId = requestAnimationFrame(updatePosition);
    };

    rafId = requestAnimationFrame(updatePosition);

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        cursorEl.style.opacity = "1";
      }
    };

    const updateSemanticState = (target: HTMLElement | null) => {
      if (!target) return;

      let nextState: "default" | "action" | "paper" | "text" = "default";

      if (target.closest("input, textarea, [contenteditable='true']")) {
        nextState = "text";
      } else if (
        target.closest(
          ".paper-row, article.paper-card, [data-evidence-card], .reading-passage"
        )
      ) {
        nextState = "paper";
      } else if (
        target.closest(
          "a, button, [role='button'], [data-slot='button'], summary, select, [tabindex='0']"
        )
      ) {
        nextState = "action";
      }

      if (nextState !== currentState) {
        currentState = nextState;
        cursorEl.dataset.state = nextState;
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      updateSemanticState(e.target as HTMLElement | null);
    };

    const onMouseDown = () => {
      isMouseDown = true;
      cursorEl.dataset.active = "true";
    };

    const onMouseUp = () => {
      isMouseDown = false;
      cursorEl.dataset.active = "false";
    };

    const onMouseLeave = () => {
      isVisible = false;
      cursorEl.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible = true;
      cursorEl.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    document.documentElement.addEventListener("mouseenter", onMouseEnter);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.documentElement.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="reticle-cursor fixed top-0 left-0 pointer-events-none z-[9999] opacity-0 will-change-transform"
      data-state="default"
      data-active="false"
      style={{
        transform: "translate3d(-100px, -100px, 0)",
      }}
    >
      {/* Central Datum Core */}
      <div className="reticle-dot" />

      {/* Crosshair & Bracket Reticles */}
      <div className="reticle-frame">
        <span className="tick-north" />
        <span className="tick-south" />
        <span className="tick-east" />
        <span className="tick-west" />
      </div>
    </div>
  );
}
