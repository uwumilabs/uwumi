import React from 'react';
import { MediaTabScreen } from '@/components/MediaBrowser';
import { MediaType } from '@/constants/types';

const Anime = () => <MediaTabScreen name="anime" mediaType={MediaType.ANIME} />;

export default Anime;
