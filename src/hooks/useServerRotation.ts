import { useCallback, useMemo, useState } from 'react';
import type { IEpisodeServer } from 'react-native-consumet';

/** Why a server was skipped. */
export type ServerFailure = 'unavailable' | 'no-video' | 'playback';

/** One try of one server. Results from any other try are ignored, so a late error can't skip the next server. */
export interface ServerAttempt {
  key: string;
  tries: number;
  server: string;
  reloads: number;
}

interface RotationState {
  key: string;
  failed: Record<string, ServerFailure>;
  manual: string | null;
  // Bumped by a pick or "try again", so a server tried before fetches fresh instead of reusing its failed query
  tries: number;
  reloads: number;
}

const initialState = (key: string): RotationState => ({ key, failed: {}, manual: null, tries: 0, reloads: 0 });

const isCurrent = (state: RotationState, attempt: ServerAttempt) =>
  state.key === attempt.key &&
  state.tries === attempt.tries &&
  state.reloads === attempt.reloads &&
  !state.failed[attempt.server];

/**
 * Picks the server to play and moves on when one fails: a picked server first, then the last one that played, then
 * the provider's order. `key` names the episode, provider and dub setting; a new key starts over.
 */
export function useServerRotation(key: string, servers: IEpisodeServer[], remembered: string | undefined) {
  const [stored, setState] = useState(() => initialState(key));
  // Reset while rendering, so a new episode never renders with the last one's failures
  let state = stored;
  if (stored.key !== key) {
    state = initialState(key);
    setState(state);
  }

  const order = useMemo(() => {
    const names = servers.map((server) => server.name);
    const preferred = [state.manual, remembered].filter((name): name is string => !!name && names.includes(name));
    return [...new Set([...preferred, ...names])];
  }, [servers, state.manual, remembered]);

  const serverName = order.find((name) => !state.failed[name]);
  const server = servers.find((candidate) => candidate.name === serverName);
  const attempt = useMemo<ServerAttempt | undefined>(
    () => (serverName ? { key, tries: state.tries, server: serverName, reloads: state.reloads } : undefined),
    [key, state.tries, state.reloads, serverName],
  );

  const fail = useCallback((failed: ServerAttempt, reason: ServerFailure) => {
    setState((current) =>
      isCurrent(current, failed)
        ? { ...current, failed: { ...current.failed, [failed.server]: reason }, reloads: 0 }
        : current,
    );
  }, []);
  // The same server again, for a stream that played and then broke
  const reload = useCallback((broken: ServerAttempt) => {
    setState((current) => (isCurrent(current, broken) ? { ...current, reloads: current.reloads + 1 } : current));
  }, []);
  const pick = useCallback((name: string) => {
    setState((current) => {
      const { [name]: _picked, ...failed } = current.failed;
      return { ...current, failed, manual: name, tries: current.tries + 1, reloads: 0 };
    });
  }, []);
  const retryAll = useCallback(() => {
    setState((current) => ({ ...current, failed: {}, manual: null, tries: current.tries + 1, reloads: 0 }));
  }, []);

  return {
    server,
    attempt,
    attemptKey: attempt ? `${key}|${attempt.tries}|${attempt.server}|${attempt.reloads}` : key,
    order,
    failed: state.failed,
    exhausted: servers.length > 0 && !server,
    switched: Object.keys(state.failed).length > 0,
    fail,
    reload,
    pick,
    retryAll,
  };
}
