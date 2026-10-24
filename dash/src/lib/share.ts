import { cache } from "react";

/** The app's info routes a shared link can point at: uwumi://info/<mediaType> */
export const SHARE_MEDIA_TYPES = ["anime", "manga", "movie"] as const;
export type ShareMediaType = (typeof SHARE_MEDIA_TYPES)[number];

/** The query a shared link carries, the same params the app's info screen reads. */
export const SHARE_PARAMS = ["id", "metaProvider", "type", "title", "episode", "season"] as const;

export interface SharedMedia {
  title?: string;
  description?: string;
  poster?: string;
  backdrop?: string;
}

const ONE_DAY = 60 * 60 * 24;

const stripHtml = (text?: string | null) =>
  text?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || undefined;

const fetchAniList = async (id: string): Promise<SharedMedia | null> => {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query:
        "query ($id: Int) { Media(id: $id) { title { english romaji } description coverImage { extraLarge large } bannerImage } }",
      variables: { id: Number(id) },
    }),
    cache: "force-cache",
    next: { revalidate: ONE_DAY },
  });
  if (!response.ok) return null;
  const media = (await response.json())?.data?.Media;
  if (!media) return null;
  return {
    title: media.title?.english || media.title?.romaji,
    description: stripHtml(media.description),
    poster: media.coverImage?.extraLarge || media.coverImage?.large,
    backdrop: media.bannerImage || undefined,
  };
};

// Optional: without a key, a movie or TV link still works and shows the title from the link
const fetchTmdb = async (id: string, type?: string): Promise<SharedMedia | null> => {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  const kind = type === "Movie" ? "movie" : "tv";
  const response = await fetch(
    `https://api.themoviedb.org/3/${kind}/${encodeURIComponent(id)}?api_key=${key}`,
    { next: { revalidate: ONE_DAY } }
  );
  if (!response.ok) return null;
  const media = await response.json();
  return {
    title: media.title || media.name,
    description: media.overview || undefined,
    poster: media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : undefined,
    backdrop: media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : undefined,
  };
};

/** Title, poster and description for a shared link's preview. Null when they can't be fetched. */
export const fetchSharedMedia = cache(
  async (id: string, metaProvider?: string, type?: string): Promise<SharedMedia | null> => {
    try {
      if (metaProvider === "anilist" || metaProvider === "anilist-manga") return await fetchAniList(id);
      if (metaProvider === "tmdb") return await fetchTmdb(id, type);
    } catch {
      // The page still works from the link's own title
    }
    return null;
  }
);
