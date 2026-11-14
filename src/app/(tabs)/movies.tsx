import React from 'react';
import { MediaTabScreen } from '@/components/MediaBrowser';
import { MediaType } from '@/constants/types';

const Movies = () => <MediaTabScreen name="movies" mediaType={MediaType.MOVIE} />;

export default Movies;
