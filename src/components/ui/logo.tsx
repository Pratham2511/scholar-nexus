import * as React from "react";

interface LogoProps {
  size?: "sm" | "lg";
  className?: string;
}

export function Logo({ size = "sm", className = "" }: LogoProps) {
  const markSize = size === "sm" ? 20 : 40;
  const textSize = size === "sm" ? "1.1rem" : "2rem";

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      style={{ lineHeight: 1 }}
    >
      {/* 3-node citation network mark in precise circle */}
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Circle boundary: stroke only, no fill */}
        <circle
          cx="12"
          cy="12"
          r="10.5"
          stroke="var(--color-gold)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Connecting citation network lines (thinner than circle stroke) */}
        <line
          x1="6.8"
          y1="13.8"
          x2="12"
          y2="8.8"
          stroke="var(--color-teal)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="8.8"
          x2="17.2"
          y2="13.8"
          stroke="var(--color-teal)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />

        {/* 3 citation nodes (left, slightly elevated center, right) */}
        <circle cx="6.8" cy="13.8" r="1.6" fill="var(--color-gold)" />
        <circle cx="12" cy="8.8" r="1.8" fill="var(--color-gold)" />
        <circle cx="17.2" cy="13.8" r="1.6" fill="var(--color-gold)" />
      </svg>

      {/* Wordmark */}
      <span
        className="inline-flex items-baseline tracking-tight"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: textSize,
          letterSpacing: "-0.02em",
        }}
      >
        <span
          style={{
            fontWeight: 400,
            color: "var(--color-text-primary)",
          }}
        >
          Scholar
        </span>
        <sup
          style={{
            color: "var(--color-red)",
            fontSize: "0.5em",
            lineHeight: 0,
            verticalAlign: "super",
            margin: "0 1px",
            userSelect: "none",
          }}
        >
          ·
        </sup>
        <span
          style={{
            fontWeight: 300,
            color: "var(--color-gold)",
          }}
        >
          Nexus
        </span>
      </span>
    </div>
  );
}
