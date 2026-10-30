/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Vercel Image Optimization quota bachane ke liye optimizer OFF
    // (products pehle se /api/watermark route se sharp-resized aa rahi hain)
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  async redirects() {
    return [
      // Purane space-wale URLs → naye clean URLs (SEO juice transfer)
      { source: '/about us', destination: '/about', permanent: true },
      { source: '/about%20us', destination: '/about', permanent: true },
      { source: '/contact us', destination: '/contact-us', permanent: true },
      { source: '/contact%20us', destination: '/contact-us', permanent: true },
      { source: '/privacy policy', destination: '/privacy-policy', permanent: true },
      { source: '/privacy%20policy', destination: '/privacy-policy', permanent: true },
      // Disclaimer page
      { source: '/disclaimer policy', destination: '/disclaimer', permanent: true },
      { source: '/disclaimer%20policy', destination: '/disclaimer', permanent: true },
    ];
  },
}

module.exports = nextConfig