import { requireOptionalNativeModule } from 'expo';

interface CastProxyModule {
  start: () => string;
  register: (url: string, headersJson: string) => string;
  stop: () => void;
}

/**
 * Serves streams to a Cast receiver on the local network (CastProxyModule.kt and .swift beside this file). Missing
 * from builds made before it, which an OTA bundle can still run on.
 */
export const castProxyModule = requireOptionalNativeModule<CastProxyModule>('CastProxyModule');

/** A URL a Cast receiver can play: the proxy fetches `url` with the provider's headers and adds CORS */
export const castUrl = (url: string, headers?: Record<string, string>) =>
  castProxyModule?.register(url, JSON.stringify(headers ?? {}));
