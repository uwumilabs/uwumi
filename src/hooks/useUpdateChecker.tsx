import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Application from 'expo-application';
import { EXTERNAL_LINKS } from '@/constants/config';
import { fetchJson } from '@/utils/http';
import pkg from '../../package.json';

/** The installed binary's version; package.json's can differ once an OTA bundle is running */
export const APP_VERSION = Application.nativeApplicationVersion ?? pkg.version;

// Android debug builds append this to the version name (build.gradle's versionNameSuffix); it isn't a release tag
const BUILD_SUFFIX = /-debug$/;

/** A build that isn't a stable release: 4.0.0-rc.1, 4.0.0-beta.2 */
export const isPreRelease = (version: string) => version.replace(BUILD_SUFFIX, '').includes('-');

type UpdateKind = 'major' | 'minor' | 'patch' | 'stable';

const UPDATE_LABELS: Record<UpdateKind, string> = {
  major: 'A major update',
  minor: 'A minor update',
  patch: 'A patch update',
  stable: 'The stable release',
};

const updateKind = (local: string, remote: string): UpdateKind | null => {
  const [localParts, remoteParts] = [local, remote].map((version) => version.split('-')[0].split('.').map(Number));
  const kinds: UpdateKind[] = ['major', 'minor', 'patch'];
  for (const [index, kind] of kinds.entries()) {
    if (localParts[index] !== remoteParts[index]) return localParts[index] < remoteParts[index] ? kind : null;
  }
  return isPreRelease(local) && !isPreRelease(remote) ? 'stable' : null;
};

/**
 * Whether GitHub has a newer stable release than this binary. Closing the update dialog dismisses it for the
 * session, in this hook's caller only.
 */
export function useUpdateChecker() {
  const [dismissed, setDismissed] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['updateChecker'],
    // Pre-releases aren't "latest", so only a stable release is offered
    queryFn: () => fetchJson<{ tag_name: string }>(EXTERNAL_LINKS.GITHUB_LATEST_RELEASE_API),
    staleTime: 1000 * 60 * 15,
    retry: 2,
  });
  const newVersion = data?.tag_name.replace('v', '') ?? '';
  const kind = newVersion ? updateKind(APP_VERSION, newVersion) : null;

  return {
    hasUpdate: !!kind,
    isUpdateAvailable: !!kind && !dismissed,
    dismiss: () => setDismissed(true),
    updateInfo: { currentVersion: APP_VERSION, newVersion, label: kind ? UPDATE_LABELS[kind] : '' },
    checkForUpdates: refetch,
    isLoading,
    isError,
  };
}
