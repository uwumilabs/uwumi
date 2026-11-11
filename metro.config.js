const fs = require('fs');
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

// The themes the CSS in src/themes defines, one `@variant <name>` each (src/scripts/generate-themes.ts reads them too)
const themesDir = path.join(__dirname, 'src/themes');
const extraThemes = fs
  .readdirSync(themesDir)
  .filter((file) => file.endsWith('.css'))
  .sort()
  .flatMap((file) =>
    [...fs.readFileSync(path.join(themesDir, file), 'utf8').matchAll(/@variant\s+([\w-]+)/g)].map((match) => match[1]),
  );

module.exports = withUniwindConfig(reanimatedConfig, {
  cssEntryFile: './global.css',
  dtsFile: './src/uniwind-types.d.ts',
  extraThemes,
});