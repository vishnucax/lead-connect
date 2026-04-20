/** @type {import('next').Config} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/lead-connect', // Assuming the repository name is lead-connect
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
