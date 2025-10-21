import { requireNativeModule } from 'expo-modules-core';

interface StoragePermissionResult {
  granted: boolean;
  status: 'granted' | 'denied' | 'pending' | 'needs_settings';
  canAskAgain?: boolean;
}

interface StoragePermissionModule {
  getAndroidVersion(): number;
  hasStoragePermission(): Promise<boolean>;
  requestStoragePermission(): Promise<StoragePermissionResult>;
  openAppSettings(): Promise<boolean>;
}

const StoragePermission = requireNativeModule('StoragePermissionModule') as StoragePermissionModule;

export default StoragePermission;

export type { StoragePermissionResult };
