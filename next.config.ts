import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  poweredByHeader: false,
  async redirects() {
    return [
      // byandforthepeople.com (+ www) is a secondary domain — 308 to the
      // single canonical so there is no duplicate-content / SEO split.
      {
        source: "/:path*",
        has: [{ type: "host", value: "byandforthepeople\\.com" }],
        destination: "https://bythepeopleforthepeople.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
