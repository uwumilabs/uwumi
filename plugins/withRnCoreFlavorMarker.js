const { withPodfile } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

// React Native's prebuilt core (Pods/React-Core-prebuilt) and Hermes (Pods/hermes-engine) swap between their Debug and
// Release builds in a build phase, trusting a .last_build_configuration marker to know which one is in place.
// `pod install` deletes the marker and can leave the Release build behind (after a release archive); the phase then
// assumes Debug and keeps it. Debug builds then fail to link RCTPackagerConnection (Debug-only core), or crash at
// launch on a missing CDPDebugAPI symbol (Debug-only Hermes). Record the flavor actually installed, from a symbol only
// the Debug build has.
const MARKER_SNIPPET = `    [
      ['React-Core-prebuilt', 'React.xcframework/*-simulator/React.framework/React', 'RCTPackagerConnection'],
      ['hermes-engine', 'destroot/Library/Frameworks/universal/hermesvm.xcframework/*-simulator/hermesvm.framework/hermesvm', 'CDPDebugAPI'],
    ].each do |pod, binary_glob, debug_symbol|
      pod_dir = File.join(installer.sandbox.root.to_s, pod)
      marker = File.join(pod_dir, '.last_build_configuration')
      binary = Dir.glob(File.join(pod_dir, binary_glob)).first
      next if binary.nil? || File.exist?(marker)
      File.write(marker, \`nm "#{binary}" 2>/dev/null\`.include?(debug_symbol) ? 'Debug' : 'Release')
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
