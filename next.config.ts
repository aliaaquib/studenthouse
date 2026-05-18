import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;
const isDevelopment = process.env.NODE_ENV !== "production";
const scriptSources = isDevelopment
  ? [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://va.vercel-scripts.com"
    ].join(" ")
  : [
      "'self'",
      "'unsafe-inline'",
      "https://va.vercel-scripts.com"
    ].join(" ");
const csp = [
  "default-src 'self'",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://images.unsplash.com${supabaseHostname ? ` https://${supabaseHostname}` : ""}`,
  `connect-src 'self' https://vitals.vercel-insights.com${process.env.NEXT_PUBLIC_SUPABASE_URL ? ` ${process.env.NEXT_PUBLIC_SUPABASE_URL} ${process.env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "wss://")}` : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-src 'self' https://www.google.com"
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      ...(supabaseHostname ? [{
        protocol: "https" as const,
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**"
      }] : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" }
        ]
      }
    ];
  }
};

export default nextConfig;
