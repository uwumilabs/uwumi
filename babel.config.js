module.exports = function (api) {
  const isProduction = api.env('production');
  api.cache(true);

  // tsconfig's `@/*` path, for `react-native bundle` in src/scripts/build-android.sh: only Expo CLI reads tsconfig paths
  const plugins = [['module-resolver', { alias: { '@': './src' } }]];
  if (isProduction) plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
