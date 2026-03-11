import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/vi/**",
      },

      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },


      {
        protocol: 'https',
        hostname: 'picsum.photos', // ⬅️ NEW MOCK HOST
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // ⬅️ NEW MOCK HOST
        port: '',
        pathname: '/**',
      },

    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
