import { requireOptionalNativeModule } from 'expo';

// iOS only (ExcludeFromBackupModule.swift beside this file), and missing from builds made before it, which an OTA
// bundle can still run on
const native = requireOptionalNativeModule<{ exclude: (path: string) => void }>('ExcludeFromBackup');

/** Keeps a file or folder (a plain path) out of iCloud and device backups. Does nothing on Android. */
export const excludeFromBackup = (path: string) => {
  try {
    native?.exclude(path);
  } catch (error) {
    console.warn(`⚠️ Couldn't exclude ${path} from backups:`, error);
  }
};
