import React from "react";
import Script from "next/script";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import Screenshots from "./Screenshots";
import Download from "./Download";
import Footer from "./Footer";

// Hallmark's slot script: drops a screenshot that fails to load, so its slot shows the plain surface
const SLOTS = `document.querySelectorAll('[data-slot] img').forEach((i) => { if (i.complete && !i.naturalWidth) i.remove(); else i.addEventListener('error', () => i.remove(), { once: true }); });`;

const Landing = () => {
  return (
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Features />
        <Screenshots />
        <Download />
      </main>
      <Footer />
      <Script id="hallmark-slots">{SLOTS}</Script>
    </div>
  );
};

export default Landing;
