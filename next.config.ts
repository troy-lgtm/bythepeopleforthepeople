import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

// Always-safe headers (do not affect iframe embedding).
const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  poweredByHeader: false,
  async headers() {
    return [
      // Safe headers on every route, including the embeddable widgets.
      { source: "/:path*", headers: baseSecurityHeaders },
      // Clickjacking protection everywhere EXCEPT the embed widgets, which are
      // meant to be iframed by third parties (/embed/* and /embed.js).
      {
        source: "/((?!embed/|embed\\.js).*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

export default nextConfig;
