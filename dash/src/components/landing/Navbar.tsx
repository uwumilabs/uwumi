"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useAdmin } from "@/hooks";
import { NAVIGATION_ITEMS, APP_CONFIG } from "@/constants";
import { useTheme } from "next-themes";
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

  const themeIcon = mounted && theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />;

  return (
    <nav className="slab" data-scrolled={scrolled || undefined} aria-label="Main">
      <div className="container slab__bar">
        <span className="slab__mark">
          <img src="/images/icon.png" alt="" width={36} height={36} />
          {APP_CONFIG.name}
        </span>

        <div className="slab__links">
          {NAVIGATION_ITEMS.map((item) => (
            <Link key={item.name} href={item.href} className="slab__link">
              {item.name}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="slab__link">
              Admin
            </Link>
          )}
        </div>

        <div className="slab__tools">
          <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle theme">
            {themeIcon}
          </button>
          <Socials />
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="btn btn--ring">Sign In</button>
            </SignInButton>
          )}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="icon-btn slab__menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </div>

      {isOpen && (
        <div className="container slab__sheet">
          {NAVIGATION_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="slab__link"
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="slab__link" onClick={() => setIsOpen(false)}>
              Admin
            </Link>
          )}
          <div className="slab__sheet-tools">
            <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle theme">
              {themeIcon}
            </button>
            <Socials />
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="btn btn--ring">Sign In</button>
              </SignInButton>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
