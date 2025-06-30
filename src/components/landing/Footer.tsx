"use client";

import { motion } from "framer-motion";
import { ExternalLink, Users, Star } from "lucide-react";

import { Github } from "@/components/svg";
import Socials from "../socials";

export default function Footer() {
  const links = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Screenshots", href: "#screenshots" },
      { name: "Download", href: "#download" },
      { name: "Releases", href: "#" },
    ],
    community: [
      { name: "GitHub", href: "#", icon: Github },
      { name: "Issues", href: "#", icon: ExternalLink },
      { name: "Discussions", href: "#", icon: Users },
      { name: "Contributors", href: "#", icon: Star },
    ],
    support: [
      { name: "Documentation", href: "#" },
      { name: "FAQ", href: "#" },
      { name: "Contact", href: "#" },
      { name: "Report Bug", href: "#" },
    ],
  };

  return (
    <footer id="github" className="border-t border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/images/icon.png" className="rounded-xl " />
              </div>
              <span className="text-xl font-bold text-foreground">Uwumi</span>
            </div>
            <p className="text-primary mb-6 leading-relaxed">
              Your ultimate entertainment companion for anime, manga, and
              movies. Built with love by the community, for the community.
            </p>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.name}>
                  <motion.a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    whileHover={{ x: 5 }}
                  >
                    {link.name}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Community Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Community
            </h3>
            <ul className="space-y-3">
              {links.community.map((link) => (
                <li key={link.name}>
                  <motion.a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center"
                    whileHover={{ x: 5 }}
                  >
                    {link.icon && <link.icon className="w-4 h-4 mr-2" />}
                    {link.name}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {links.support.map((link) => (
                <li key={link.name}>
                  <motion.a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    whileHover={{ x: 5 }}
                  >
                    {link.name}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-border mt-12 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <p className="text-primary/30">
                © 2024 Uwumi. Open source and free forever.
              </p>
            </div>
            <Socials />
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
