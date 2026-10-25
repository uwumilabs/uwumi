const { withTVAndroidBannerImage } = require('@react-native-tvos/config-tv/build/withTVAndroidBannerImage');
const { withTVAndroidManifest } = require('@react-native-tvos/config-tv/build/withTVAndroidManifest');

// One Android APK serves phones and TVs. config-tv only adds its manifest entries (leanback launcher,
// banner, optional touchscreen, no portrait lock) on TV prebuilds, so this applies them on phone prebuilds too.
// Its TV icon is left out: it replaces android:icon, which is the phone launcher icon
const withAndroidTV = (config) => {
  const tvPlugin = (config.plugins ?? []).find(
    (plugin) => Array.isArray(plugin) && plugin[0] === '@react-native-tvos/config-tv',
  );
  const params = { ...tvPlugin?.[1], androidTVIcon: undefined };
  config = withTVAndroidBannerImage(config, params);
  return withTVAndroidManifest(config, params);
};

module.exports = withAndroidTV;
