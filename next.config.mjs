/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-libsql",
      "@libsql/client",
    ],
  },
};

export default nextConfig;
