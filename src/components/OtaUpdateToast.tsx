import { useEffect, useRef } from 'react';
import { reloadApp } from 'react-native-nitro-ota';
import { Toast, useToast, type ToastComponentProps } from './heroui';
import { useHasActiveDownloads, useOtaUpdateStore } from '@/hooks';
import { Progress } from './native';
import { HUXStack, HUYStack } from './ui-primitives';

const READY_TOAST_DURATION = 8000;

const OtaUpdateToastContent = (props: ToastComponentProps) => {
  const status = useOtaUpdateStore((state) => state.status);
  const percent = useOtaUpdateStore((state) => state.percent);
  const isReady = status === 'ready';
  const hasActiveDownloads = useHasActiveDownloads();

  return (
    <Toast {...props}>
      <HUXStack className="items-center justify-between gap-3">
        <HUYStack className="flex-1 gap-0.5">
          <Toast.Title>{isReady ? 'Update ready' : 'Downloading update'}</Toast.Title>
          <Toast.Description>
            {!isReady
              ? percent === null
                ? 'Starting…'
                : `${percent}%`
              : hasActiveDownloads
                ? 'Applies next launch, or restart from About once downloads finish'
                : 'Restart to apply it now, or it applies next launch'}
          </Toast.Description>
        </HUYStack>
        {isReady && !hasActiveDownloads && <Toast.Action onPress={() => reloadApp()}>Restart</Toast.Action>}
      </HUXStack>
      {!isReady && <Progress className="mt-3" value={percent ?? 0} />}
    </Toast>
  );
};

/**
 * Mirrors useOtaUpdates' download in a toast: progress while it downloads, then a restart offer once the bundle
 * is ready. Toast items are memoized, so the content reads the store itself.
 */
export const OtaUpdateToast = () => {
  const { toast } = useToast();
  const status = useOtaUpdateStore((state) => state.status);
  const toastId = useRef<string | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      if (toastId.current) toast.hide(toastId.current);
      toastId.current = null;
      return;
    }
    toastId.current ??= toast.show({
      duration: 'persistent',
      component: (props) => <OtaUpdateToastContent {...props} />,
    });
    if (status !== 'ready') return;
    const id = toastId.current;
    const timer = setTimeout(() => {
      toast.hide(id);
      toastId.current = null;
    }, READY_TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [status, toast]);

  return null;
};

export default OtaUpdateToast;
