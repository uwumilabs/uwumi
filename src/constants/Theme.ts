import { createThemeBuilder } from '@tamagui/theme-builder';
// palettes array should be in form [accentBackground,background, color, color2, color3, color4, color5, color6]
export const palettes = {
  light: [
    '#fefbff', //background,accentColor  0
    '#0058ca', // Primary color          1
    '#1b1b1f', //color1                  2
    '#6a6a71', //color2,borderColor      3
    '#e9eefb', //color3                  4
    '#b0c6ff', //color4                  5
    '#0e1015', //color5                  6
  ],
  dark: ['#1b1b1f', '#b0c6ff', '#fefbff', '#44464f', '#272931', '#0058ca', '#0e1015'],
  light_cloudflare: ['#eff2f5', '#f38020', '#1b1b22', '#cac4d0', '#efe9e3', '#f38020'],
  dark_cloudflare: ['#1b1b22', '#f38020', '#eff2f5', '#49454f', '#2d2322', '#f38020', '#140b03'],
  light_cotton_candy: ['#fffbff', '#9a4058', '#201a1b', '#f3dde0', '#f7ecf1', '#5bcefa'],
  dark_cotton_candy: ['#201a1b', '#ffb1c1', '#ece0e0', '#524345', '#322629', '#004d63', '#150f10'],
};
// eslint-disable-next-line react-hooks/rules-of-hooks
const templates = {
  light_base: {
    accentBackground: 0,
    accentColor: 0,
    color: 1,
    color1: 2,
    color2: 3,
    color3: 4,
    color4: 5,
    background: 0,
    borderColor: 3,
  },
  dark_base: {
    accentBackground: 0,
    accentColor: 0,
    color: 1,
    color1: 2,
    color2: 3,
    color3: 4,
    color4: 5,
    color5: 6,
    background: 0,
    borderColor: 3,
  },
};

export const themes = createThemeBuilder()
  .addPalettes(palettes)
  .addTemplates(templates)
  .addThemes({
    light: {
      template: 'base',
      palette: 'light',
    },
    dark: {
      template: 'base',
      palette: 'dark',
    },
  })
  .addChildThemes({
    default: [
      {
        parent: 'light',
        template: 'base',
        palette: 'light',
      },
      {
        parent: 'dark',
        template: 'base',
        palette: 'dark',
      },
    ],
    cloudflare: [
      {
        parent: 'light',
        template: 'base',
        palette: 'light_cloudflare',
      },
      {
        parent: 'dark',
        template: 'base',
        palette: 'dark_cloudflare',
      },
    ],
    cottonCandy: [
      {
        parent: 'light',
        template: 'base',
        palette: 'light_cotton_candy',
      },
      {
        parent: 'dark',
        template: 'base',
        palette: 'dark_cotton_candy',
      },
    ],
  })
  .build();
