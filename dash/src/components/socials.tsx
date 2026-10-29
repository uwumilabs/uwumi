import { LINKS } from "@/constants";
import React from "react";
import { Discord, Github } from "./svg";

const Socials = () => {
  return (
    <div className="socials">
      <a href={LINKS.discord} className="icon-btn" aria-label="Uwumi on Discord">
        <Discord aria-hidden />
      </a>
      <a href={LINKS.github} className="icon-btn" aria-label="Uwumi on GitHub">
        <Github aria-hidden />
      </a>
    </div>
  );
};

export default Socials;
