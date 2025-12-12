// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const baseConfig = getDefaultConfig(__dirname);
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