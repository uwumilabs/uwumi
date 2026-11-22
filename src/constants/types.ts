export enum MediaType {
  ANIME = 'anime',
  MANGA = 'manga',
  MOVIE = 'movie',
}

export type MediaFeedType = 'trending' | 'popular' | 'search';
export type MetaProvider = 'anilist' | 'anilist-manga' | 'tmdb';

export enum EpisodeDisplayMode {
  FullMetadata = 'full',
  TitleOnly = 'title',
  NumberOnly = 'number',
}

export interface ExternalSubtitleData {
  MatchedBy: string;
  IDSubMovieFile: string;
  MovieHash: string;
  MovieByteSize: string;
  MovieTimeMS: string;
  IDSubtitleFile: string;
  SubFileName: string;
  SubActualCD: string;
  SubSize: string;
  SubHash: string;
  SubLastTS: string;
  SubTSGroup: string;
  InfoReleaseGroup: string;
  InfoFormat: string;
  InfoOther: string;
  IDSubtitle: string;
  UserID: string;
  SubLanguageID: string;
  SubFormat: string;
  SubSumCD: string;
  SubAuthorComment: string;
  SubAddDate: string;
  SubBad: string;
  SubRating: string;
  SubSumVotes: string;
  SubDownloadsCnt: string;
  MovieReleaseName: string;
  MovieFPS: string;
  IDMovie: string;
  IDMovieImdb: string;
  MovieName: string;
  MovieNameEng: string | null;
  MovieYear: string;
  MovieImdbRating: string;
  SubFeatured: string;
  UserNickName: string;
  SubTranslator: string;
  ISO639: string;
  LanguageName: string;
  SubComments: string;
  SubHearingImpaired: string;
  UserRank: string;
  SeriesSeason: string;
  SeriesEpisode: string;
  MovieKind: string;
  SubHD: string;
  SeriesIMDBParent: string;
  SubEncoding: string;
  SubAutoTranslation: string;
  SubForeignPartsOnly: string;
  SubFromTrusted: string;
  QueryCached: number;
  SubTSGroupHash: string;
  SubDownloadLink: string;
  ZipDownloadLink: string;
  SubtitlesLink: string;
  QueryNumber: string;
  QueryParameters: {
    episode: number;
    season: number;
    imdbid: string;
    sublanguageid: string;
  };
  Score: number;
}

export interface SubtitleTrack {
  title: string;
  /** ISO 639-2 (`eng`), from `subtitleLanguageCode` */
  language?: string;
  /** Unset: the player tells from the file */
  format?: 'srt' | 'vtt';
  uri: string;
  headers?: Record<string, string>;
}
