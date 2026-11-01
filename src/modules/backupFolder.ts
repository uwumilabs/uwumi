import { requireOptionalNativeModule } from 'expo';

interface BackupFolderModule {
  bookmark: (uri: string) => string;
  name: (bookmark: string) => string;
  write: (bookmark: string, name: string, contents: string) => string;
  list: (bookmark: string) => string[];
  remove: (bookmark: string, name: string) => void;
}

/**
 * iOS: a folder outside uwumi that backups can go to at any launch (BackupFolderModule.swift beside this file).
 * Missing on Android, and from iOS builds made before it, which an OTA bundle can still run on.
 */
export const backupFolderModule = requireOptionalNativeModule<BackupFolderModule>('BackupFolder');
