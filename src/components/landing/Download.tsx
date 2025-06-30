"use client";

import { motion } from "framer-motion";
import {
  Download as DownloadIcon,
  Smartphone,
  Star,
  Users,
  Code,
  Heart,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Github } from "../svg";

export default function Download() {
  const stats = [
    { icon: Star, value: "4.8/5", label: "User Rating" },
    { icon: Users, value: "10K+", label: "Downloads" },
    { icon: Code, value: "Open", label: "Source" },
    { icon: Heart, value: "Free", label: "Forever" },
  ];

  const platforms = [
    {
      name: "Android APK",
      icon: Smartphone,
      description: "Download directly for Android devices",
      color: "from-green-500 to-emerald-500",
      available: true,
    },
    {
      name: "iOS (TestFlight)",
      icon: Smartphone,
      description: "Beta testing via TestFlight",
      color: "from-blue-500 to-cyan-500",
      available: false,
    },
  ];

  return (
    <section id="download" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground  mb-6">
            Download Uwumi
          </h2>
          <p className="text-xl text-foreground-secondary max-w-3xl mx-auto">
            Get started with Uwumi today. Available for multiple platforms with
            more coming soon.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-accent bg-card hover:bg-accent/5 transition-colors">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary-gradient rounded-full flex items-center justify-center">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Download Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <Card className="border-accent hover:shadow-2xl transition-all duration-300 h-full">
                <CardContent className="p-8">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-r ${platform.color} p-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <platform.icon className="w-full h-full text-white" />
                    </div>
                    <div
                      className={`absolute inset-0 w-16 h-16 rounded-xl bg-gradient-to-r ${platform.color} opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300`}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {platform.name}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {platform.description}
                  </p>

                  {/* Button */}
                  <motion.button
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      platform.available
                        ? "bg-primary-gradient text-primary-foreground hover:shadow-lg"
                        : "bg-accent text-muted-foreground cursor-not-allowed"
                    }`}
                    whileHover={platform.available ? { scale: 1.02 } : {}}
                    whileTap={platform.available ? { scale: 0.98 } : {}}
                    disabled={!platform.available}
                  >
                    {platform.available ? (
                      <span className="flex items-center justify-center">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download
                      </span>
                    ) : (
                      "Coming Soon"
                    )}
                  </motion.button>

                  {!platform.available && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                        Soon
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* GitHub Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700 text-white">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-6">
                <Github className="w-12 h-12 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold">Open Source</h3>
                  <p className="text-gray-300">
                    Built with ❤️ by the community
                  </p>
                </div>
              </div>

              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Uwumi is completely open source. Check out the code, contribute
                to the project, or report issues on GitHub. Join our growing
                community of developers and users!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Github className="w-5 h-5 mr-2" />
                  View Source Code
                </motion.button>

                <motion.button
                  className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Latest Release
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
