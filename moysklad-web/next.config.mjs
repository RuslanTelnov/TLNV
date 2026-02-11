// import withPWAInit from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', '*.vercel.app']
    }
  }
};

export default nextConfig;
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
