import { Download } from "lucide-react";
import { Github } from "../svg";
import { LINKS } from "@/constants";

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__text">
          <h1 id="hero-title">Stream anime, read manga, watch movies</h1>
          <p className="lead">
            One free, open-source app for Android and iOS, built with React Native and Expo.
          </p>

          <ul className="counter" aria-label="Get uwumi">
            <li className="counter__row">
              <span className="counter__name">Android</span>
              <span className="counter__line">The APK, from the latest release</span>
              <a className="btn btn--primary" href={LINKS.latestRelease}>
                <Download aria-hidden />
                Download Now
              </a>
            </li>
            <li className="counter__row">
              <span className="counter__name">iOS</span>
              <span className="counter__line">The IPA, to sideload</span>
              <a className="btn btn--ring" href={LINKS.latestRelease}>
                <Download aria-hidden />
                Get the IPA
              </a>
            </li>
            <li className="counter__row">
              <span className="counter__name">Source</span>
              <span className="counter__line">Check out the code, or contribute</span>
              <a className="btn btn--ring" href={LINKS.github}>
                <Github aria-hidden />
                View on GitHub
              </a>
            </li>
          </ul>
        </div>

        <div className="hero__well hero__visual">
          <figure className="shot hero__shot" data-slot="home" data-kind="product">
            <img
              src="/images/screenshots/app-home.jpg"
              alt="The uwumi home screen: continue watching, trending and popular anime"
              width={720}
              height={1616}
              fetchPriority="high"
            />
          </figure>
          <figure className="shot hero__shot" data-slot="reader" data-kind="product">
            <img
              src="/images/screenshots/reader.png"
              alt="A manga chapter open in the uwumi reader"
              width={408}
              height={916}
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
