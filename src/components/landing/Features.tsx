"use client";

import { motion } from "framer-motion";
import {
  Play,
  BookOpen,
  Film,
  Download,
  Smartphone,
  Wifi,
  Heart,
  Search,
  Shield,
  Zap,
  Globe,
  Star,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export default function Features() {
  const features = [
    {
      icon: Play,
      title: "Anime Streaming",
      description:
        "Watch thousands of anime episodes in HD quality with multiple subtitle options.",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: BookOpen,
      title: "Manga Reader",
      description:
        "Read manga with a beautiful, customizable reader interface and offline support.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Film,
      title: "Movie Collection",
      description:
        "Discover and stream movies from various genres with detailed information.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Download,
      title: "Offline Downloads",
      description:
        "Download content for offline viewing when you're on the go.",
      color: "from-purple-500 to-violet-500",
    },
    {
      icon: Search,
      title: "Smart Search",
      description:
        "Find content quickly with our intelligent search and recommendation system.",
      color: "from-orange-500 to-yellow-500",
    },
    {
      icon: Heart,
      title: "Favorites & Lists",
      description:
        "Create custom lists and mark your favorite content for easy access.",
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: Shield,
      title: "Ad-Free Experience",
      description:
        "Enjoy uninterrupted streaming without annoying advertisements.",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: Zap,
      title: "Fast Performance",
      description:
        "Lightning-fast loading times and smooth playback on all devices.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Globe,
      title: "Multi-Language",
      description:
        "Support for multiple languages with subtitles and dubbing options.",
      color: "from-teal-500 to-green-500",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section id="features" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need for the ultimate entertainment experience, all
            in one app.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="group relative"
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 group-hover:shadow-lg">
                <CardContent className="p-8">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} p-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-full h-full text-white" />
                    </div>
                    <div
                      className={`absolute inset-0 w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300`}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-primary-gradient rounded-2xl p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <Star className="w-8 h-8 mr-2" />
              <span className="text-2xl font-bold text-primary-foreground/80">
                Open Source & Free
              </span>
            </div>
            <p className="text-lg opacity-90 mb-6 text-primary-foreground/60">
              Uwumi is completely free and open source. Join our community and
              contribute to making it even better!
            </p>
            <Button className="px-8 py-3 !text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
              View Source Code
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
