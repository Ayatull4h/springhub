/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.greennetwork.id" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "www.springhub.id" },
      { protocol: "https", hostname: "springhub.id" },
    ],
  },
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "sharp",
    "@aws-sdk/client-s3",
    "@aws-sdk/lib-storage",
    "ioredis",
    "bullmq",
    "nodemailer",
    "pino",
    "jsdom",
    "dompurify",
  ],
  experimental: {
    clientRouterFilter: true,
    clientRouterFilterRedirects: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(self), microphone=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://*.openstreetmap.org https://*.basemaps.cartocdn.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.openstreetmap.org https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://*.r2.dev https://images.unsplash.com https://*.greennetwork.id https://upload.wikimedia.org https://img.youtube.com https://i.ytimg.com https://www.springhub.id https://static.cloudflareinsights.com https://placehold.co",
              "font-src 'self' data:",
              "connect-src 'self' https://api.xendit.co https://*.r2.dev https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://static.cloudflareinsights.com",
              "media-src 'self' https://*.r2.dev",
              "frame-src https://www.youtube.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/donations/webhook",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
