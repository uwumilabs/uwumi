"use client";

import { motion } from "framer-motion";
import { Play, BookOpen, Film, Download, Star, Users, Zap } from "lucide-react";

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
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

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-background via-secondary to-background pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Main Heading */}
          <motion.div variants={itemVariants} className="mb-8">
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-foreground mb-6"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="bg-primary-gradient bg-clip-text text-transparent">
                Uwumi
              </span>
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Your ultimate entertainment companion. Stream anime, read manga,
              and watch movies all in one beautiful app.
            </motion.p>
          </motion.div>

          {/* Feature Icons */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center items-center space-x-8 mb-12"
          >
            {[
              { icon: Play, label: "Anime", color: "text-red-500" },
              { icon: BookOpen, label: "Manga", color: "text-green-500" },
              { icon: Film, label: "Movies", color: "text-blue-500" },
            ].map((item, index) => (
              <div
                key={item.label}
                // animate="animate"
                className="flex flex-col items-center"
                // style={{ animationDelay: `${index * 0.5}s` }}
              >
                <div
                  className={`w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2 ${item.color}`}
                >
                  <item.icon className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-8 max-w-md mx-auto mb-12"
          >
            {[
              { icon: Star, value: "4.8", label: "Rating" },
              { icon: Users, value: "10K+", label: "Users" },
              { icon: Zap, value: "Free", label: "Forever" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="flex justify-center mb-2">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              className="px-8 py-4 bg-primary-gradient text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-5 h-5" />
              <span>Download Now</span>
            </motion.button>

            <motion.button
              className="px-8 py-4 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              View on GitHub
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
