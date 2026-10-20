import type { NextConfig } from "next";

const supabaseOrigin = (() => {
  try { return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : ""; }
  catch { return ""; }
})();
const connectSources = ["'self'", supabaseOrigin, supabaseOrigin.replace(/^http/, "ws")].filter(Boolean).join(" ");
const scriptSources = process.env.NODE_ENV === "production"
  ? "'self' 'unsafe-inline'"
  // Next.js React Refresh evaluates development bundles. Keep this exception
  // out of production so the deployed CSP never grants unsafe-eval.
  : "'self' 'unsafe-inline' 'unsafe-eval'";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src ${connectSources}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  // Safari upgrades localhost asset URLs to HTTPS, but next dev serves HTTP.
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Keep development assets separate from production builds and their manifests.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store, private" }] },
      { source: "/account/:path*", headers: [{ key: "Cache-Control", value: "no-store, private" }, { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
    ];
  },
};

export default nextConfig;
