import type { NextConfig } from "next";

/**
 * Next.js configuration with security hardening.
 *
 * - `output: "standalone"` produces a self-contained server bundle for deployment
 * - `reactStrictMode: true` surfaces unsafe side effects during development
 * - Security headers are applied via the `headers()` function below
 */
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false, // Don't leak "Next.js" in X-Powered-By header
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking — site cannot be framed
          { key: "X-Frame-Options", value: "DENY" },
          // Block MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer policy — only send origin to cross-origin targets
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — disable unused browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Strict transport security — enforce HTTPS for 1 year (only honored over HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Content Security Policy — allow inline styles (Next.js needs them)
          // and allow images from anywhere (academic paper thumbnails from many domains)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
