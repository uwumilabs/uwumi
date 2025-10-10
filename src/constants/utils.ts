// export const getFetchUrl = () => {
//   if (process.env.NODE_ENV === 'production') {
//     return {
//       apiUrl: process.env.EXPO_PUBLIC_API_URL,
//       episodeApiUrl: process.env.EXPO_PUBLIC_EPISODE_API_URL,
//     };
//   } else {
//     return {
//       apiUrl: process.env.EXPO_PUBLIC_API_URL_DEV,
//       episodeApiUrl: process.env.EXPO_PUBLIC_EPISODE_API_URL_DEV,
//     };
//   }
// };
export const formatTime = (seconds: number): string => {
  // Handle invalid inputs
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  // Format with hours if present
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  // Ensure minutes are never negative
  const minutes = Math.max(0, m);
  return `${minutes}:${s.toString().padStart(2, '0')}`;
};

export const hexToRGB = (hex: string, alpha?: number): string => {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Convert 3-digit hex to 6-digit
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((char) => char + char)
          .join('')
      : cleanHex;

  // Parse hex values
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // Return RGB or RGBA
  return alpha !== undefined ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
};

export const compareVersions = (localVersion: string, remoteVersion: string) => {
  // Split version strings into arrays and parse as numbers
  const local = localVersion.split('-')[0].split('.').map(Number);
  const remote = remoteVersion.split('-')[0].split('.').map(Number);
  // console.log({ local, remote, localVersion, remoteVersion });
  // Compare major version
  if (local[0] !== remote[0]) {
    return local[0] < remote[0] ? 'Major update available' : 'No update';
  }

  // Compare minor version
  if (local[1] !== remote[1]) {
    return local[1] < remote[1] ? 'Minor update available' : 'No update';
  }

  // Compare patch version
  if (local[2] !== remote[2]) {
    return local[2] < remote[2] ? 'Patch update available' : 'No update';
  }

  // Handle release candidate versions
  const isLocalRC = localVersion.includes('-rc');
  const isRemoteRC = remoteVersion.includes('-rc');

  if (isLocalRC && !isRemoteRC) {
    return 'Stable version available';
  }

  return 'No update available';
};
