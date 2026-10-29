"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Film,
  Settings,
  LogOut,
  House
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { ADMIN_NAVIGATION_ITEMS, APP_CONFIG } from "../../constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const iconMap = {
  LayoutDashboard,
  Users,
  Film,
  Settings,
  House
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <Sidebar variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <img src="/images/icon.png" alt="" width={36} height={36} className="h-9 w-9 rounded-md" />
          <div>
            <h1 className="font-display text-lg font-medium lowercase leading-tight text-sidebar-foreground">
              {APP_CONFIG.name} Admin
            </h1>
            <p className="text-xs text-muted-foreground">
              Content Management
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_NAVIGATION_ITEMS.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                          : "text-ink-2"
                      }
                    >
                      <Link href={item.href}>
                        <Icon className="h-5 w-5" aria-hidden />
                        <span className="font-display font-medium lowercase">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-error hover:bg-paper-3 hover:text-error"
            >
              <LogOut className="h-5 w-5" aria-hidden />
              <span>Sign Out</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
