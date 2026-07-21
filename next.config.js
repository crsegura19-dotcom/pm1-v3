/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/blog', destination: '/blog/index.html' },
      { source: '/blog/', destination: '/blog/index.html' },
    ];
  },
};

module.exports = nextConfig;
