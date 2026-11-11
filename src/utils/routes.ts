import type { MediaType } from '@/constants/types';
import { activeProvider } from '@/hooks/stores/useProviderStore';
import { routeParams } from './episodes';
import { META_PROVIDERS } from './media';

export const infoHref = ({
  mediaType,
  id,
  type,
  image,
  title,
  sharedTag,
}: {
  mediaType: MediaType;
  id: string | number;
  type?: string;
  image?: string;
  title?: string;
  sharedTag?: string;
}) => ({
  pathname: '/info/[mediaType]' as const,
  params: routeParams({
    mediaType,
    metaProvider: META_PROVIDERS[mediaType],
    type,
    provider: activeProvider(mediaType),
    id,
    image,
    title,
    sharedTag,
  }),
});

export type ReaderParams = {
  /** The AniList id */
  id: string;
  chapter: string;
  provider: string;
  /** Opened from the previous or next chapter button, with the reader already open */
  continued?: string;
  /** The manga's, for Continue reading and History */
  title?: string;
  image?: string;
};

export const readerHref = (params: ReaderParams) => ({
  pathname: '/read/[id]' as const,
  params: routeParams(params),
});
