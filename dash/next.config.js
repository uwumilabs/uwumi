/** @type {import('next').NextConfig} */
const nextConfig = {
  // The dash lives inside the uwumi app's repo, which has its own lockfile and node_modules one level up
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  images: {
    domains: ['images.pexels.com', 'github.com'],
  },
  // Use Babel for compilation instead of SWC
  experimental: {
    forceSwcTransforms: false,
  },
  // Configure webpack to handle compilation
  webpack: (config, { dev, isServer }) => {
    // Disable SWC loader and use Babel instead
    config.module.rules.forEach((rule) => {
      if (rule.use && rule.use.loader === 'next-swc-loader') {
        rule.use.loader = 'babel-loader'
        rule.use.options = {
          presets: ['next/babel'],
        }
      }
    })

    return config
  },
  // Disable SWC-based features
  compiler: {
    removeConsole: false,
    reactRemoveProperties: false,
  },
}

module.exports = nextConfig