const { withPodfile } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

// React Native's prebuilt core (Pods/React-Core-prebuilt) swaps between its Debug and Release frameworks in a build
// phase, trusting a .last_build_configuration marker to know which one is in place. `pod install` can leave the
// Release framework without the marker; the phase then assumes Debug, and Debug builds fail to link
// RCTPackagerConnection (it only exists in the Debug framework). Record the flavor actually installed.
const MARKER_SNIPPET = `    rncore_dir = File.join(installer.sandbox.root.to_s, 'React-Core-prebuilt')
    rncore_marker = File.join(rncore_dir, '.last_build_configuration')
    rncore_binary = Dir.glob(File.join(rncore_dir, 'React.xcframework', '*-simulator', 'React.framework', 'React')).first
    if rncore_binary && !File.exist?(rncore_marker)
      rncore_debug = \`nm "#{rncore_binary}" 2>/dev/null\`.include?('RCTPackagerConnection')
      File.write(rncore_marker, rncore_debug ? 'Debug' : 'Release')
    end`;

const addMarkerStep = (podfile) =>
  mergeContents({
    tag: 'uwumi-rncore-flavor-marker',
    src: podfile,
    newSrc: MARKER_SNIPPET,
    anchor: /post_install do \|installer\|/,
    offset: 1,
    comment: '#',
  }).contents;

const withRnCoreFlavorMarker = (config) =>
  withPodfile(config, (config) => {
    config.modResults.contents = addMarkerStep(config.modResults.contents);
    return config;
  });

module.exports = withRnCoreFlavorMarker;
module.exports.addMarkerStep = addMarkerStep;
