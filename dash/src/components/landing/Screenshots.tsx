"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const modes = [
  {
    id: "watch",
    label: "Watch",
    line: "A video player with custom controls, subtitles in many languages, dubbing options and no ads.",
    image: "/images/screenshots/app-player.jpg",
    alt: "A downloaded Jujutsu Kaisen episode playing, with subtitles and the player controls",
    width: 1800,
    height: 802,
  },
  {
    id: "read",
    label: "Read",
    line: "A manga reader you can customize, with offline support.",
    image: "/images/screenshots/reader.png",
    alt: "A manga chapter open in the reader",
    width: 408,
    height: 916,
  },
];

// Without script both screens show in order; with it, the tabs switch between them
export default function Screenshots() {
  const [mode, setMode] = useState(0);
  const [ready, setReady] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => setReady(true), []);

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = (mode + step + modes.length) % modes.length;
    setMode(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="screenshots" className="switch" aria-labelledby="screenshots-title">
      <div className="container">
        <div className="switch__head">
          <h2 id="screenshots-title">5. Watch or read</h2>
          <div className="seg" role="tablist" aria-label="Watch or read" onKeyDown={onKeyDown}>
            {modes.map((item, index) => (
              <button
                key={item.id}
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={index === mode}
                aria-controls={`panel-${item.id}`}
                tabIndex={index === mode ? 0 : -1}
                onClick={() => setMode(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {modes.map((item, index) => (
          <div
            key={item.id}
            role="tabpanel"
            id={`panel-${item.id}`}
            aria-labelledby={`tab-${item.id}`}
            hidden={ready && index !== mode}
            className={`switch__panel switch__panel--${item.id}`}
          >
            <figure className="shot" data-slot={item.id} data-kind="product">
              <img src={item.image} alt={item.alt} width={item.width} height={item.height} loading="lazy" />
            </figure>
            <p className="lead">{item.line}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
