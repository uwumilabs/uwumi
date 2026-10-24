const { AndroidConfig, withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

// Picture-in-picture for the player, which goes in it when the user leaves a playing video. react-native-video has an
// Expo plugin for this, but its git fork ships without the built lib/ the plugin loads.
//   Android: the main activity has to support picture-in-picture
//   iOS: picture-in-picture needs the audio background mode
const withPictureInPicture = (config) => {
  config = withAndroidManifest(config, (config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    mainActivity.$['android:supportsPictureInPicture'] = 'true';
    return config;
  });

  return withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes ?? [];
    if (!modes.includes('audio')) config.modResults.UIBackgroundModes = [...modes, 'audio'];
    return config;
  });
};

module.exports = withPictureInPicture;
