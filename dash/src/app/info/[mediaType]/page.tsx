import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, Play } from "lucide-react";
import { LINKS } from "@/constants";
import {
  fetchSharedMedia,
  SHARE_MEDIA_TYPES,
  SHARE_PARAMS,
  type ShareMediaType,
} from "@/lib/share";

type Props = {
  params: Promise<{ mediaType: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

// About three lines of the synopsis, ending on a whole sentence where one fits; the app has the rest
const blurb = (text: string, max = 260) => {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentence > max / 2) return head.slice(0, sentence + 1);
  return `${head.slice(0, head.lastIndexOf(" ")).replace(/[\s.,;:!?]+$/, "")}…`;
};

/** A link shared from the app: https://<site>/info/<mediaType>?id=…, the same route and query as uwumi://info/… */
async function readShare({ params, searchParams }: Props) {
  const { mediaType } = await params;
  const query = await searchParams;
  const id = first(query.id);
  if (!SHARE_MEDIA_TYPES.includes(mediaType as ShareMediaType) || !id) notFound();

  // %20 rather than URLSearchParams' "+", which the app would read as a literal plus
  const shareQuery = SHARE_PARAMS.flatMap((key) => {
    const value = first(query[key]);
    return value ? [`${key}=${encodeURIComponent(value)}`] : [];
  }).join("&");
  const episode = first(query.episode);
  const season = first(query.season);
  const media = await fetchSharedMedia(id, first(query.metaProvider), first(query.type));

  return {
    title: media?.title || first(query.title) || "this on uwumi",
    description: media?.description,
    poster: media?.poster,
    backdrop: media?.backdrop ?? media?.poster,
    episodeLabel: episode ? `${season ? `S${season} · ` : ""}EP ${episode}` : undefined,
    appLink: `uwumi://info/${mediaType}?${shareQuery}`,
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { title, description, poster, episodeLabel } = await readShare(props);
  const heading = `Watch ${title}${episodeLabel ? ` · ${episodeLabel}` : ""} on uwumi`;
  return {
    title: heading,
    description,
    openGraph: { title: heading, description, images: poster ? [poster] : undefined },
    twitter: { card: poster ? "summary_large_image" : "summary", title: heading, description },
  };
}

export default async function SharedInfoPage(props: Props) {
  const { title, description, poster, backdrop, episodeLabel, appLink } = await readShare(props);
  const banner = backdrop && backdrop !== poster ? backdrop : undefined;

  return (
    <div className="share">
      <header className="share__bar">
        <div className="container">
          <a href="/" className="share__mark">
            <img src="/images/icon.png" alt="" width={36} height={36} />
            uwumi
          </a>
        </div>
      </header>

      <main className="container share__main">
        <section className="share__grid" aria-labelledby="share-title">
          {poster && (
            <img src={poster} alt={title} className="share__poster" fetchPriority="high" />
          )}
          <div className="share__text">
            {episodeLabel && <p className="share__episode">{episodeLabel}</p>}
            <h1 id="share-title" className="share__title">{title}</h1>
            {description && <p className="share__desc">{blurb(description)}</p>}
            <div className="share__actions">
              <a href={appLink} className="btn btn--primary">
                <Play aria-hidden />
                Open in uwumi
              </a>
              <a href={LINKS.latestRelease} className="btn btn--ring">
                <Download aria-hidden />
                Download uwumi
              </a>
            </div>
            <p className="share__note">
              Don&apos;t have uwumi yet? Install it, then open this link again.
            </p>
          </div>
        </section>
        {banner && <img src={banner} alt="" className="share__banner" loading="lazy" />}
      </main>
    </div>
  );
}
