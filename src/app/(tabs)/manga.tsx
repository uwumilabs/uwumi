import React from 'react';
import { MediaTabScreen } from '@/components/MediaBrowser';
import { MediaType } from '@/constants/types';

const Manga = () => <MediaTabScreen name="manga" mediaType={MediaType.MANGA} />;

export default Manga;
