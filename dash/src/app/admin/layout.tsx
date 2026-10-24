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
          <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-6 py-4">
              <SidebarTrigger />

              <div className="flex items-center space-x-4">
                {/* User Profile Info */}
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-gradient flex items-center justify-center text-white font-semibold text-sm">
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
                    <p className="text-sm font-medium text-foreground">
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
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  {mounted && theme === "dark" ? (
                    <Sun className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Moon className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Notification Bell */}
                <button className="p-2 hover:bg-accent rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
