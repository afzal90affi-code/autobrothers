/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
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
    ];
  },
}

module.exports = nextConfig