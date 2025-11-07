import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "https://lh3.googleusercontent.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com", // This is the required fix
        port: "",
        pathname: "/vi/**", // Allows any path under /vi, which is standard for YouTube thumbnails
      },
    ],
  },
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      config.devtool = false;
    }
        return config;
  },
};

export default nextConfig;
