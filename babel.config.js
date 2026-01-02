module.exports = function (api) {
  const isProduction = api.env('production');
  api.cache(true);

  const plugins = [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@/constants': './src/constants',
          '@/components': './src/components',
          '@/hooks': './src/hooks',
          '@': './src'
        },
      },
    ],
    'react-native-reanimated/plugin',
  ];

  if (isProduction) {
    plugins.unshift(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};