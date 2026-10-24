// metro.config.js
const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const baseConfig = getDefaultConfig(__dirname);
// The dash (a Next.js app with its own node_modules) lives in dash/; keep Metro out of it
baseConfig.resolver.blockList = [
  ...[].concat(baseConfig.resolver.blockList ?? []),
  new RegExp(`^${path.join(__dirname, 'dash').replace(/[/\\.]/g, '\\$&')}\\/.*`),
];
const reanimatedConfig = wrapWithReanimatedMetroConfig(baseConfig);

module.exports = withUniwindConfig(reanimatedConfig, {
  cssEntryFile: './global.css',
  dtsFile: './src/uniwind-types.d.ts',
  extraThemes: [
    'default-light',
    'default-dark',
    'cloudflare-light',
    'cloudflare-dark',
    'cotton-candy-light',
    'cotton-candy-dark',
  ],
});