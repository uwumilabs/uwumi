import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * @param {() => boolean} onBackPress - Should return `true` to prevent the default back behavior, or `false` to allow it.
 */

export const useBackHandler = (enabled: boolean, onBackPress: () => boolean) => {
  const onBackPressRef = useRef(onBackPress);

  useEffect(() => {
    onBackPressRef.current = onBackPress;
  });

  useEffect(() => {
    if (!enabled) return;

    const backAction = () => {
      return onBackPressRef.current();
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [enabled]);
};
