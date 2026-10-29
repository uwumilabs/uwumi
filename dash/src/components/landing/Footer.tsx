import { APP_CONFIG, LINKS } from "@/constants";
import Socials from "../socials";

export default function Footer() {
  const links = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Screenshots", href: "#screenshots" },
      { name: "Download", href: "#download" },
      { name: "Releases", href: `${LINKS.github}/releases` },
    ],
    community: [
      { name: "GitHub", href: LINKS.github },
      { name: "Issues", href: `${LINKS.github}/issues` },
      { name: "Contributors", href: `${LINKS.github}/graphs/contributors` },
    ],
    support: [
      { name: "Documentation", href: `${LINKS.github}#readme` },
      { name: "Contact", href: LINKS.discord },
      { name: "Report Bug", href: `${LINKS.github}/issues/new` },
    ],
  };

  return (
    <footer id="github" className="foot">
      <div className="container">
        <p className="foot__statement">
          Uwumi is completely open source. Check out the code, contribute, or report issues on GitHub.
        </p>

        <div className="foot__links">
          <div>
            <h3 className="foot__label">Product</h3>
            <ul>
              {links.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="foot__label">Community</h3>
            <ul>
              {links.community.map((link) => (
                <li key={link.name}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="foot__label">Support</h3>
            <ul>
              {links.support.map((link) => (
                <li key={link.name}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="foot__base">
          <span className="foot__mark">
            <img src="/images/icon.png" alt="" width={28} height={28} />
            {APP_CONFIG.name}
          </span>
          <p>© 2024 Uwumi.</p>
          <Socials />
        </div>
      </div>
    </footer>
  );
}
