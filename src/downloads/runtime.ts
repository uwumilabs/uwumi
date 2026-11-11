import { createWorkletRuntime } from 'react-native-worklets';

export const downloadRuntime = createWorkletRuntime({
  name: 'download-progress',
  animationQueuePollingRate: 500,
});
