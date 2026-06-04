import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization for football-data.org crests
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "crests.football-data.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128],
  },

  // Security & caching headers
  async headers() {
    return [
      {
        source: "/api/ai/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-transform" },
        ],
      },
      {
        source: "/:path*(.svg|.png|.webp|.avif|.ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },

  // Compress responses (default is true, explicit for clarity)
  compress: true,

  // Optimize package imports for tree-shaking
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
    ],
  },
};

export default nextConfig;
