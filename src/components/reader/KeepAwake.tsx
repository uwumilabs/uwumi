import { useKeepAwake } from 'expo-keep-awake';

/** Keeps the screen on while mounted; a component, so the reader can mount it only while the setting is on */
export const KeepAwake = () => {
  useKeepAwake();
  return null;
};
