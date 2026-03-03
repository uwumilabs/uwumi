/**
 * useTVRemoteHandler - A convenience hook wrapping react-native-tvos's useTVEventHandler.
 *
 * Provides a clean callback interface for each D-pad / remote button event.
 * On non-TV platforms this hook is a no-op.
 *
 * Usage:
 *   useTVRemoteHandler({
 *     onUp: () => console.log('up'),
 *     onSelect: () => console.log('select pressed'),
 *   });
 */

import { useCallback } from 'react';
import { useTVEventHandler, type HWEvent } from 'react-native';
import { isTV } from '@/constants/utils';

export interface TVRemoteHandlerCallbacks {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onLongUp?: () => void;
  onLongDown?: () => void;
  onLongLeft?: () => void;
  onLongRight?: () => void;
  onSelect?: () => void;
  onPlayPause?: () => void;
  /** Called for any event type not explicitly handled above */
  onUnhandled?: (event: HWEvent) => void;
}

export function useTVRemoteHandler(callbacks: TVRemoteHandlerCallbacks) {
  const handler = useCallback(
    (event: HWEvent) => {
      // Only handle key-down events (eventKeyAction === 0) to avoid double-firing
      if (event.eventKeyAction !== undefined && event.eventKeyAction !== 0) return;

      switch (event.eventType) {
        case 'up':
          callbacks.onUp?.();
          break;
        case 'down':
          callbacks.onDown?.();
          break;
        case 'left':
          callbacks.onLeft?.();
          break;
        case 'right':
          callbacks.onRight?.();
          break;
        case 'longUp':
          callbacks.onLongUp?.();
          break;
        case 'longDown':
          callbacks.onLongDown?.();
          break;
        case 'longLeft':
          callbacks.onLongLeft?.();
          break;
        case 'longRight':
          callbacks.onLongRight?.();
          break;
        case 'select':
          callbacks.onSelect?.();
          break;
        case 'playPause':
          callbacks.onPlayPause?.();
          break;
        default:
          callbacks.onUnhandled?.(event);
          break;
      }
    },
    [callbacks],
  );

  // On non-TV platforms, don't attach any listener
  if (isTV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTVEventHandler(handler);
  }
}
