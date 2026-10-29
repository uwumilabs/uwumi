"use client";

import { useEffect, useRef, useState } from "react";

const stages = [
  {
    title: "1. Add your sources",
    line: "Install the extensions you want for anime and movies, then pick one per show.",
    image: "/images/screenshots/app-extensions.jpg",
    alt: "The extensions screen, with anime sources to install or remove",
  },
  {
    title: "2. Find a show or a manga",
    line: "Search anime, manga and movies, or browse what is trending and popular.",
    image: "/images/screenshots/app-search.jpg",
    alt: "Manga search results for Jujutsu",
  },
  {
    title: "3. Every episode on one screen",
    line: "The rating and the synopsis above, and continue where you left off.",
    image: "/images/screenshots/app-details.jpg",
    alt: "The Jujutsu Kaisen details screen with its episode list",
  },
  {
    title: "4. Favorites and downloads",
    line: "Keep favorites for each kind, and download episodes to watch offline or open in another app.",
    image: "/images/screenshots/app-downloads.jpg",
    alt: "Downloaded episodes of Jujutsu Kaisen, ready to play offline",
  },
];

// Without script (or under 60rem) each stage shows its own screen; with it, one screen pins and follows the stages
export default function Features() {
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const panels = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    setReady(true);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    panels.current.forEach((panel) => panel && observer.observe(panel));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="pinned" data-ready={ready || undefined} aria-label="Features">
      <div className="container pinned__grid">
        <div className="pinned__frame">
          <div className="shot pinned__screens" data-slot="stages" data-kind="product">
            {stages.map((stage, index) => (
              <img
                key={stage.image}
                src={stage.image}
                alt={stage.alt}
                width={720}
                height={1616}
                loading="lazy"
                data-active={index === active || undefined}
                aria-hidden={index !== active}
              />
            ))}
          </div>
        </div>

        <ol className="pinned__panels">
          {stages.map((stage, index) => (
            <li
              key={stage.title}
              className="panel"
              data-index={index}
              ref={(node) => {
                panels.current[index] = node;
              }}
            >
              <div className="panel__text">
                <h2>{stage.title}</h2>
                <p className="lead">{stage.line}</p>
              </div>
              <figure className="shot panel__shot" data-slot={`stage-${index + 1}`} data-kind="product">
                <img src={stage.image} alt={stage.alt} width={720} height={1616} loading="lazy" />
              </figure>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
