"use client";

import { useState, useEffect } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { AdminSidebar } from "./admin-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { user } = useClerk();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset>
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-background border-b border-border">
            <div className="flex items-center justify-between px-6 py-4">
              <SidebarTrigger />

              <div className="flex items-center gap-2">
                {/* User Profile Info */}
                <div className="hidden sm:flex items-center gap-3 pr-2">
                  <div className="w-8 h-8 rounded-full bg-paper-3 flex items-center justify-center font-display font-medium text-sm text-ink">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || user.firstName || "User"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      (
                        user?.firstName?.charAt(0) ||
                        user?.emailAddresses?.[0]?.emailAddress?.charAt(0) ||
                        "U"
                      ).toUpperCase()
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className="font-display text-sm font-medium text-foreground">
                      {user?.fullName || user?.firstName || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </p>
                  </div>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="grid h-10 w-10 place-items-center rounded-full transition-colors duration-micro ease-out hover:bg-paper-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {mounted && theme === "dark" ? (
                    <Sun className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Moon className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Notification Bell */}
                <button
                  aria-label="Notifications"
                  className="grid h-10 w-10 place-items-center rounded-full transition-colors duration-micro ease-out hover:bg-paper-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="mx-auto w-full max-w-[90rem] p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
