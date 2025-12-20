module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
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
            '@':'./src'
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};