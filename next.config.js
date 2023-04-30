/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };
    config.externals = [...config.externals, 'pinecone-client'];

    return config;
  },
};

module.exports = nextConfig;
