import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    experimental: {
      serverActions: {
        allowedOrigins: ['localhost:3000', 'localhost:3001', '*.vercel.app']
      }
    }
  };

  // Exporting without PWA for now due to build error with Next.js 16/Turbo
  export default nextConfig;
