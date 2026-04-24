import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],

  // Headers de sécurité pour la production
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },

  // Optimisation images
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },

  // Compression activée par défaut en prod
  compress: true,

  // Strict mode React
  reactStrictMode: true,
}

export default nextConfig
