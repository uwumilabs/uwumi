import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';
import { Uniwind } from 'uniwind';
import { useThemeStore } from '@/hooks/stores/useThemeStore';
import { useDownloadStore } from '@/downloads/useDownloadStore';
import { clearCacheOnLaunch } from '@/services/cache';
import { startEpisodeAlerts } from '@/services/episodeAlerts';
import { runAutoBackupIfDue } from '@/services/backup';

// What the app does as it starts, once per JS load. The root layout imports it after the stylesheet, which the theme
// needs, and Fast Refresh can run it again, so each part is safe to repeat.
SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs(['StatusBar backgroundColor is not supported with edge-to-edge enabled']);
Uniwind.setTheme(useThemeStore.getState().themeName);
useDownloadStore.getState().initialize();
clearCacheOnLaunch();
startEpisodeAlerts();
runAutoBackupIfDue();
