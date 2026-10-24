import React from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import Screenshots from "./Screenshots";
import Download from "./Download";
import Footer from "./Footer";

const Landing = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Features />
      <Screenshots />
      <Download />
      <Footer />
    </div>
  );
};

export default Landing;
