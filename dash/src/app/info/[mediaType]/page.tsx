import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LINKS } from "@/constants";
import { cn } from "@/lib/utils";
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <a href="/" className="text-sm font-semibold tracking-widest text-muted-foreground">
          uwumi
        </a>
        {poster && (
          <img
            src={poster}
            alt={title}
            className="aspect-[2/3] w-44 rounded-xl object-cover shadow-2xl"
          />
        )}
        <div className="space-y-2">
          {episodeLabel && <p className="text-sm font-semibold text-primary">{episodeLabel}</p>}
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="line-clamp-4 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex w-full flex-col gap-3">
          <a href={appLink} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            <Play />
            Open in uwumi
          </a>
          <a
            href={LINKS.latestRelease}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            <Download />
            Download uwumi
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Don&apos;t have uwumi yet? Install it, then open this link again.
        </p>
      </div>
    </main>
  );
}
