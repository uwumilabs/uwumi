import { Download as DownloadIcon } from "lucide-react";
import { Github } from "../svg";
import { LINKS } from "@/constants";

// The close: one field in the accent, its white pill the only fill
export default function Download() {
  return (
    <section id="download" className="get" aria-labelledby="download-title">
      <div className="container get__inner">
        <div className="get__text">
          <h2 id="download-title">Download Uwumi</h2>
          <p className="lead">The Android APK and the iOS IPA, on every release.</p>
        </div>
        <div className="get__actions">
          <a className="btn btn--field" href={LINKS.latestRelease}>
            <DownloadIcon aria-hidden />
            Download
          </a>
          <a className="btn btn--ring" href={LINKS.github}>
            <Github aria-hidden />
            View Source Code
          </a>
        </div>
      </div>
    </section>
  );
}
