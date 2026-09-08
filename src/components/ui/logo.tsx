import * as React from "react";

interface LogoProps {
  size?: "sm" | "lg";
  className?: string;
  showDescriptor?: boolean;
}

export function Logo({
  size = "sm",
  className = "",
  showDescriptor = false,
}: LogoProps) {
  const isSm = size === "sm";
  const markSize = isSm ? 22 : 38;

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      style={{ lineHeight: 1 }}
    >
      {/* The Convergence Aperture: Precision Orthogonal Reticle */}
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 text-text-primary"
      >
        {/* Upper-Left Framing Bracket */}
        <path
          d="M4 10V4H10"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="square"
        />
        {/* Lower-Right Framing Bracket */}
        <path
          d="M20 14V20H14"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="square"
        />
        {/* Central Convergence Axes */}
        <line
          x1="12"
          y1="7"
          x2="12"
          y2="17"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="square"
          opacity="0.45"
        />
        <line
          x1="7"
          y1="12"
          x2="17"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="square"
          opacity="0.45"
        />
        {/* Focal Datum Point (Editorial Vermilion) */}
        <rect
          x="10.5"
          y="10.5"
          width="3"
          height="3"
          fill="var(--color-accent, #E1523D)"
        />
      </svg>

      {/* Precision Typographic Wordmark */}
      <div className="flex flex-col justify-center">
        <div
          className="flex items-baseline gap-1.5"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: isSm ? "0.95rem" : "1.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <span className="font-semibold text-text-primary">Scholar</span>
          <span
            className="text-text-tertiary font-mono"
            style={{
              fontSize: isSm ? "0.75rem" : "1.2rem",
              userSelect: "none",
              opacity: 0.7,
            }}
          >
            {"//"}
          </span>
          <span className="font-normal text-text-secondary">Nexus</span>
        </div>

        {showDescriptor && (
          <span
            className="font-mono text-text-tertiary uppercase tracking-widest mt-0.5"
            style={{ fontSize: "0.58rem" }}
          >
            § EVIDENCE DESK
          </span>
        )}
      </div>
    </div>
  );
}
