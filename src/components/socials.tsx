import { LINKS } from "@/constants";
import { motion } from "framer-motion";
import React from "react";
import { Discord, Github } from "./svg";

const Socials = () => {
  return (
    <div className="flex items-center space-x-6">
      <motion.a
        href={LINKS.discord}
        className="text-muted-foreground hover:text-primary transition-colors duration-200"
        whileHover={{ scale: 1.1 }}
      >
        <Discord className="w-5 h-5" />
      </motion.a>
      <motion.a
        href={LINKS.github}
        className="text-muted-foreground hover:text-primary transition-colors duration-200"
        whileHover={{ scale: 1.1 }}
      >
        <Github className="w-5 h-5" />
      </motion.a>
    </div>
  );
};

export default Socials;
