"use client";

import * as React from "react";

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -1 }}
    >
      {/* Effect 1 — MANUSCRIPT GRID */}
      <svg
        className="fixed inset-0 w-full h-full ambient-breathe"
        style={{
          opacity: 0.6,
          zIndex: -1,
        }}
      >
        <defs>
          <pattern
            id="manuscript-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            {/* Horizontal line at y=0 (every 48px, but paired with y=24 gives every 24px) */}
            <line
              x1="0"
              y1="0"
              x2="48"
              y2="0"
              stroke="var(--color-border)"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
            {/* Horizontal line at y=24 (giving faint lines every 24px) */}
            <line
              x1="0"
              y1="24"
              x2="48"
              y2="24"
              stroke="var(--color-border)"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
            {/* Vertical line every 48px */}
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="48"
              stroke="var(--color-border)"
              strokeWidth="0.5"
              strokeOpacity="0.15"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#manuscript-grid)" />
      </svg>

      {/* Effect 2 — CORNER VIGNETTE */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, var(--color-ground) 100%)",
          zIndex: -1,
        }}
      />

      {/* Effect 3 — TOP EDGE GLOW */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-gold) 30%, var(--color-teal) 70%, transparent 100%)",
          opacity: 0.25,
          zIndex: 50,
        }}
      />
    </div>
  );
}
