import type { NextConfig } from "next";

const developmentScriptPolicy =
  process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${developmentScriptPolicy} https://www.googletagmanager.com https://connect.facebook.net https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://cdn.sanity.io https://storage.googleapis.com https://firebasestorage.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.facebook.com",
  "media-src 'self' blob: https://cdn.sanity.io https://storage.googleapis.com https://firebasestorage.googleapis.com",
  "connect-src 'self' https://*.api.sanity.io https://*.google-analytics.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://www.google.com https://www.googleadservices.com https://*.doubleclick.net https://www.facebook.com https://connect.facebook.net https://firestore.googleapis.com https://storage.googleapis.com https://firebasestorage.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://fcm.googleapis.com https://api.openai.com",
  "frame-src 'self' https://www.google.com https://maps.google.com https://*.doubleclick.net https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com https://www.facebook.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ["pdfkit", "sharp"],
  experimental: {
    proxyClientMaxBodySize: 85 * 1024 * 1024,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/firebase-messaging-sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
