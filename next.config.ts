import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Seed M02 usa fotos de Unsplash como placeholder
      { protocol: "https", hostname: "images.unsplash.com" },
      // Producción: Supabase Storage del proyecto real
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
