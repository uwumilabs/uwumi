"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { useState } from "react";

export default function Screenshots() {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [hoveredScreenshot, setHoveredScreenshot] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const screenshots = [
    {
      title: "Home",
      description: "Browse trending anime with beautiful card layouts",
      image: "/screenshots/home.jpeg",
      category: "Home",
      width: 540,
      height: 1200,
      aspectRatio: "9/16",
    },
    {
      title: "Details",
      description: "Detailed information with ratings and reviews",
      image: "/screenshots/details.jpeg",
      category: "Details",
      width: 540,
      height: 1200,
      aspectRatio: "9/16",
    },
    {
      title: "Video Player",
      description: "Immersive video player with custom controls",
      image: "/screenshots/player.jpeg",
      category: "Player",
      width: 1200,
      height: 540,
      aspectRatio: "16/9",
    },
    {
      title: "Manga Reader",
      description: "Beautiful manga reading experience",
      image: "/screenshots/reader.png",
      category: "Reader",
      width: 540,
      height: 1200,
      aspectRatio: "9/16",
    },
    {
      title: "Search & Discovery",
      description: "Find content with smart search features",
      image: "/screenshots/search.jpeg",
      category: "Search",
      width: 540,
      height: 1200,
      aspectRatio: "9/16",
    },
    {
      title: "Favorites",
      description: "Manage your favorite content easily",
      image: "/screenshots/favorite.jpeg",
      category: "Lists",
      width: 540,
      height: 1200,
      aspectRatio: "9/16",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const handleMouseEnter = (screenshot: any, event: React.MouseEvent) => {
    setHoveredImage(screenshot.image);
    setHoveredScreenshot(screenshot);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredImage(null);
    setHoveredScreenshot(null);
  };

  return (
    <section
      id="screenshots"
      className="py-20 bg-gradient-to-br from-secondary to-background"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Take a look at Uwumi's beautiful interface and smooth user
            experience across all features.
          </p>
        </motion.div>

        {/* Screenshots Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {screenshots.map((screenshot, index) => (
            <motion.div
              key={screenshot.title}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="group relative"
              onMouseEnter={(e) => handleMouseEnter(screenshot, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 group-hover:shadow-lg">
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={screenshot.image}
                    alt={screenshot.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      {screenshot.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                    {screenshot.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {screenshot.description}
                  </p>
                </CardContent>

                {/* Hover Overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Image Preview Popup */}
        <AnimatePresence>
          {hoveredImage && hoveredScreenshot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="fixed pointer-events-none z-50"
              style={{
                left: mousePosition.x + 20,
                top: mousePosition.y - 100,
                transform: "translate(0, -50%)",
              }}
            >
              <div
                className="bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
                style={{
                  width:
                    hoveredScreenshot.aspectRatio === "9/16"
                      ? "200px"
                      : "320px",
                  maxWidth: "400px",
                }}
              >
                <div className="relative">
                  <img
                    src={hoveredImage}
                    alt="Preview"
                    className="w-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2">
                    <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                      <p className="text-xs text-white">
                        {hoveredScreenshot.title} Preview
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="bg-primary/90 backdrop-blur-sm rounded px-2 py-1">
                      <p className="text-xs text-white">
                        {hoveredScreenshot.width}×{hoveredScreenshot.height}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with React Native and Expo for a native experience across all
            platforms. Smooth animations, intuitive navigation, and beautiful
            design throughout.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
