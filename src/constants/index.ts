/**
 * Application constants
 */

export const APP_CONFIG = {
  name: "Uwumi",
  description:
    "Feature-rich anime, manga and movie streaming app built with React Native and Expo. Download now for the ultimate entertainment experience.",
  version: "1.0.0",
} as const;

export const NAVIGATION_ITEMS = [
  { name: "Features", href: "#features" },
  { name: "Screenshots", href: "#screenshots" },
  { name: "Download", href: "#download" },
  { name: "GitHub", href: "#github" },
] as const;

export const ADMIN_NAVIGATION_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { name: "Content", href: "/admin/content", icon: "Film" },
  { name: "Users", href: "/admin/users", icon: "Users" },
  { name: "Settings", href: "/admin/settings", icon: "Settings" },
  { name: "Home", href: "/", icon: "House" },
] as const;

// Chart colors for analytics
export const CHART_COLORS = {
  primary: "#8B5CF6",
  secondary: "#EC4899",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
} as const;

// API endpoints (for future use)
export const API_ENDPOINTS = {
  auth: "/api/auth",
  users: "/api/users",
  content: "/api/content",
  analytics: "/api/analytics",
} as const;

export const LINKS={
  discord: "https://discord.gg/n7xVPxbG4R",
  github: "https://github.com/2004durgesh"
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You are not authorized to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "An internal server error occurred.",
  NETWORK_ERROR: "Network error. Please check your connection.",
} as const;
