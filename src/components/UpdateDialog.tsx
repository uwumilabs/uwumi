import { Text, View } from 'react-native';
import { EXTERNAL_LINKS } from '@/constants/config';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { openBrowser } from '@/utils/share';
import { Dialog } from './heroui';
import { Button } from './Button';
import { IoniconsIcon } from './Icons';

/** Offers a newer release from GitHub once the check finds one; closing it keeps it closed for the session */
export const UpdateDialog = () => {
  const { isUpdateAvailable, updateInfo, dismiss } = useUpdateChecker();
  if (!isUpdateAvailable) return null;
  return (
    <Dialog isOpen onOpenChange={(open) => !open && dismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50" />
        <Dialog.Content className="rounded-3xl bg-background p-5">
          <Dialog.Close className="absolute right-3 top-3" />

          <View className="items-center mt-1 mb-3">
            <IoniconsIcon name="arrow-up-circle-outline" className="text-accent" size={48} />
          </View>

          <View className="gap-3">
            <Dialog.Title className="text-center text-sm font-semibold text-foreground">
              New Version Available
            </Dialog.Title>

            <View className="flex-row justify-center gap-6">
              <View className="items-center">
                <Text className="text-base text-foreground">Current</Text>
                <Text className="text-base font-semibold text-foreground">{updateInfo.currentVersion}</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="items-center">
                <Text className="text-base text-foreground">New</Text>
                <Text className="text-base font-semibold text-foreground">{updateInfo.newVersion}</Text>
              </View>
            </View>

            <Dialog.Description className="text-center text-base text-foreground/80">
              {updateInfo.label} is now available.
            </Dialog.Description>

            <View className="gap-3">
              <Button
                variant="primary"
                onPress={() => openBrowser(EXTERNAL_LINKS.GITHUB_LATEST_RELEASE)}
                className="w-full">
                Update Now
              </Button>
              <Dialog.Close size="md" variant="ghost" isIconOnly={false} className="w-full">
                Not Now
              </Dialog.Close>
            </View>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};
