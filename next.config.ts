/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    loader: "default",         // ← חשוב: מאלץ שימוש ב־/_next/image
    path: "/_next/image",
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/v0/b/**" },
      { protocol: "https", hostname: "storage.googleapis.com",        pathname: "/**" },
    ],
    // אופציונלי: קיבוע גדלי רוחב חוקיים (ראה סעיף 3)
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig;
