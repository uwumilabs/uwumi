"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useAdmin } from "@/hooks";
import { NAVIGATION_ITEMS, APP_CONFIG } from "@/constants";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import Socials from "../socials";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isSignedIn } = useUser();
  const { isAdmin } = useAdmin();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-background backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className="">
              <img src="/images/icon.png" className="w-9 rounded-xl" />
            </div>
            <span className="text-xl font-bold bg-primary-gradient bg-clip-text text-transparent">
              {APP_CONFIG.name}
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {NAVIGATION_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}

              {/* Admin Link */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-primary hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <Socials />

            {/* Auth */}
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <SignInButton mode="modal">
                <Button className="bg-primary-gradient text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300">
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>

          {/* Mobile menu Button */}
          <div className="md:hidden">
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-background border-t border-border"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/admin"
                className="block px-3 py-2 text-primary hover:text-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Admin
              </Link>
            )}

            <div className="border-t pt-2 flex items-center justify-between px-3">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                {mounted && theme === "dark" ? (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              <Socials />

              {/* Auth Button */}

              {isSignedIn ? (
                <div className="flex items-center space-x-3">
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <Button className="bg-primary-gradient text-white px-4 py-2 rounded-lg font-medium">
                    Sign In
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

export default Navbar;
