import { useEffect } from 'react';
import type { CaptionError } from 'react-native-video-toolkit';
import { useToast } from '@/components/heroui';

type CaptionErrorListener = (error: CaptionError) => void;
const listeners = new Set<CaptionErrorListener>();

/** The video provider's `onCaptionError`: it sits above heroui's toasts, so `CaptionErrorToasts` shows the errors */
export const reportCaptionError = (error: CaptionError) => listeners.forEach((listener) => listener(error));

/** Rendered once inside heroui's provider */
export const CaptionErrorToasts = () => {
  const { toast } = useToast();
  useEffect(() => {
    const listener: CaptionErrorListener = (error) =>
      toast.show({
        variant: 'danger',
        label: "Subtitles didn't load",
        description:
          error.code === 'LOAD_FAILED' || error.code === 'TIMEOUT'
            ? "The subtitle file didn't download."
            : "The subtitle file couldn't be read.",
      });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [toast]);
  return null;
};
