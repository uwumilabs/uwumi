import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { compareVersions } from '@/constants/utils';
import pkg from '../../package.json';

interface UpdateData {
  tag_name: string;
  created_at: string;
  prerelease: boolean;
}

interface UpdateInfo {
  currentVersion: string;
  newVersion: string;
  updateType: string;
  createdAt: string;
  isNewVersionPreRelease: boolean;
}

export function useUpdateChecker(url?: string) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const { data, isLoading, isError, error, refetch, isSuccess } = useQuery({
    queryKey: ['updateChecker', url],
    queryFn: async (): Promise<UpdateData | UpdateData[]> => {
      if (!url) throw new Error('URL is required');
      const { data } = await axios.get(url);
      return data;
    },
    enabled: !!url,
    staleTime: 1000 * 60 * 15,
    retry: 2,
  });

  const updateInfo = useMemo<UpdateInfo>(() => {
    if (data && isSuccess) {
      const localVersion = pkg.version;
      const remoteVersion = Array.isArray(data) ? data[0].tag_name.replace('v', '') : data.tag_name.replace('v', '');

      // Get update type
      const updateType = compareVersions(localVersion, remoteVersion);

      return {
        currentVersion: localVersion,
        newVersion: remoteVersion,
        updateType,
        createdAt: Array.isArray(data) ? data[0].created_at : data.created_at,
        isNewVersionPreRelease: Array.isArray(data) ? data[0].prerelease : data.prerelease,
      };
    }
    return {
      currentVersion: pkg.version,
      newVersion: '',
      updateType: '',
      createdAt: '',
      isNewVersionPreRelease: false,
    };
  }, [data, isSuccess]);

  // Handle successful data fetch
  useEffect(() => {
    if (updateInfo.newVersion) {
      // Set update available if it's not "No update available"
      // and the new version is not a pre-release (for stable releases only)
      const hasUpdate = !updateInfo.updateType.includes('No update') && !updateInfo.isNewVersionPreRelease;
      setIsUpdateAvailable(hasUpdate);
    }
  }, [updateInfo]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      //console.log('Update check failed:', error);
    }
  }, [isError, error]);

  return {
    isUpdateAvailable,
    isUpdateChecked: isSuccess || isError, // Checked if either success or error
    updateInfo,
    checkForUpdates: refetch,
    setIsUpdateAvailable,
    isLoading,
    isError,
    error,
    data,
  };
}
