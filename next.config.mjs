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
    ],
  },
  experimental: {
    clientRouterFilter: true,
    clientRouterFilterRedirects: true,
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-pg",
      "sharp",
      "@aws-sdk/client-s3",
      "@aws-sdk/lib-storage",
      "ioredis",
      "bullmq",
      "nodemailer",
      "pino",
    ],
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.openstreetmap.org",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.openstreetmap.org https://*.tile.openstreetmap.org https://*.supabase.co https://*.r2.dev https://images.unsplash.com https://*.greennetwork.id https://upload.wikimedia.org https://img.youtube.com https://i.ytimg.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.xendit.co https://*.supabase.co https://*.r2.dev",
              "media-src 'self' https://*.supabase.co https://*.r2.dev",
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
