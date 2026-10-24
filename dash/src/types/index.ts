import { UserResource } from "@clerk/types";

/**
 * User-related types
 */
export interface UwumiUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  isAdmin: boolean;
  createdAt: Date;
}

/**
 * Admin-related types
 */
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  monthlyViews: number;
}

export interface AdminAnalytics {
  stats: AdminStats;
  userActivity: UserActivity[];
  contentStats: ContentStats;
  popularContent: PopularContent;
}

export interface UserActivity {
  date: string;
  users: number;
  views: number;
}

export interface ContentStats {
  anime: number;
  manga: number;
  movies: number;
}

export interface PopularContent {
  anime: MediaItem[];
  manga: MediaItem[];
  movies: MediaItem[];
}

export interface MediaItem {
  id: string;
  title: string;
  rating: number;
  poster?: string;
  cover?: string;
}

/**
 * Navigation types
 */
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<any>;
}

export interface AdminNavItem extends NavItem {
  icon: React.ComponentType<any>;
}

/**
 * Component prop types
 */
export interface LayoutProps {
  children: React.ReactNode;
}

export interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Utility types
 */
export type Theme = "light" | "dark";

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

/**
 * Extended Clerk user type
 */
export type ExtendedUser = UserResource & {
  isAdmin?: boolean;
};
