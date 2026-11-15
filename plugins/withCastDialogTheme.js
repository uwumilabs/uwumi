const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

// Google's Cast dialogs (androidx.mediarouter) take their colours from the style in the activity theme's
// mediaRouteTheme, and a style can't be built at runtime. So this writes one per uwumi theme, from
// src/themes/theme.ts, and src/modules/CastDialogModule.kt applies the current theme's before the dialog opens.
// Themes added after a build fall back to the last style applied.

const BACKGROUND = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
  <corners android:radius="24dp" />
  <solid android:color="?android:attr/colorBackground" />
</shape>
`;

const readThemes = (projectRoot) => {
  const source = fs.readFileSync(path.join(projectRoot, 'src/themes/theme.ts'), 'utf8');
  return [...source.matchAll(/'([\w-]+)': \{([^}]*)\}/g)].map(([, name, body]) => {
    const color = (key) => {
      const value = body.match(new RegExp(`\\b${key}: '(#[0-9A-Fa-f]{6})'`))?.[1];
      if (!value) throw new Error(`withCastDialogTheme: theme ${name} has no hex ${key}`);
      return value;
    };
    // The same colours as castDialogColors in src/modules/castDialog.ts, which iOS uses
    return {
      name: name.replace(/-/g, '_'),
      dark: name.endsWith('-dark'),
      background: color('overlay'),
      text: color('overlayForeground'),
      secondaryText: color('muted'),
      accent: color('accent'),
    };
  });
};

const styles = (themes) =>
  themes
    .map(
      ({ name, dark, background, text, secondaryText, accent }) => `
  <style name="UwumiCastDialog_${name}" parent="${dark ? 'Theme.MediaRouter' : 'Theme.MediaRouter.Light'}">
    <item name="android:windowBackground">@drawable/cast_dialog_background</item>
    <item name="android:colorBackground">${background}</item>
    <item name="android:textColorPrimary">${text}</item>
    <item name="android:textColorSecondary">${secondaryText}</item>
    <item name="android:textColorLink">${accent}</item>
    <item name="android:colorAccent">${accent}</item>
    <item name="android:colorControlActivated">${accent}</item>
    <item name="colorAccent">${accent}</item>
    <item name="colorControlActivated">${accent}</item>
    <item name="colorPrimary">${accent}</item>
    <item name="colorPrimaryDark">${accent}</item>
    <item name="android:borderlessButtonStyle">@style/UwumiCastDialogButton_${name}</item>
  </style>
  <!-- The app's Material 3 theme makes the dialog's buttons MaterialButtons, which ignore colorPrimary above -->
  <style name="UwumiCastDialogButton_${name}" parent="Widget.Material3.Button.TextButton">
    <item name="android:textColor">${accent}</item>
  </style>
  <style name="UwumiCastDialogOverlay_${name}">
    <item name="mediaRouteTheme">@style/UwumiCastDialog_${name}</item>
  </style>`,
    )
    .join('\n');

const withCastDialogTheme = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const res = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res');
      const themes = readThemes(config.modRequest.projectRoot);
      fs.mkdirSync(path.join(res, 'drawable'), { recursive: true });
      fs.writeFileSync(path.join(res, 'drawable/cast_dialog_background.xml'), BACKGROUND);
      fs.writeFileSync(
        path.join(res, 'values/cast_dialog_themes.xml'),
        `<?xml version="1.0" encoding="utf-8"?>\n<resources>${styles(themes)}\n</resources>\n`,
      );
      return config;
    },
  ]);

module.exports = withCastDialogTheme;
